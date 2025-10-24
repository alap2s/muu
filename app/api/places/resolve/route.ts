import { NextRequest, NextResponse } from 'next/server'

type ResolveBody = {
  url?: string
  name?: string
  lat?: number
  lng?: number
  placeId?: string
}

function parseMapsUrl(mapsUrl: string): { nameGuess?: string; lat?: number; lng?: number; placeId?: string } {
  try {
    const u = new URL(mapsUrl)
    const params = u.searchParams
    // Some short links wrap the real maps URL in a `link` param
    const nestedLink = params.get('link')
    if (nestedLink) {
      const nested = parseMapsUrl(nestedLink)
      if (nested.placeId || nested.nameGuess || (nested.lat !== undefined && nested.lng !== undefined)) {
        return nested
      }
    }

    let nameGuess = params.get('q') || undefined
    let placeId = params.get('place_id') || params.get('query_place_id') || undefined

    // q=place_id:XXXX pattern
    if (!placeId && nameGuess && nameGuess.toLowerCase().startsWith('place_id:')) {
      placeId = nameGuess.split(':')[1]
      nameGuess = undefined
    }

    // /maps/place/<Name>/...
    if (!nameGuess) {
      const matchPlace = u.pathname.match(/\/maps\/place\/([^/]+)/)
      if (matchPlace) {
        try {
          nameGuess = decodeURIComponent(matchPlace[1].replace(/\+/g, ' '))
        } catch {}
      }
    }

    // Extract coordinates from path like /@lat,lng, or query like q=loc:lat,lng or q=lat,lng
    if (u.pathname) {
      const atMatch = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (atMatch) {
        const [_, la, ln] = atMatch
        const laNum = parseFloat(la)
        const lnNum = parseFloat(ln)
        if (!Number.isNaN(laNum) && !Number.isNaN(lnNum)) {
          return { nameGuess, lat: laNum, lng: lnNum, placeId }
        }
      }
    }

    const q = params.get('q')
    if (q && !nameGuess) {
      const locMatch = q.match(/^loc:(-?\d+\.\d+),(-?\d+\.\d+)/i) || q.match(/^(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (locMatch) {
        const laNum = parseFloat(locMatch[1])
        const lnNum = parseFloat(locMatch[2])
        if (!Number.isNaN(laNum) && !Number.isNaN(lnNum)) {
          return { nameGuess: undefined, lat: laNum, lng: lnNum, placeId }
        }
      }
    }

    // Parse @lat,lng in path e.g. /@52.5200,13.4050,15z
    const atMatch = u.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    let lat: number | undefined
    let lng: number | undefined
    if (atMatch) {
      lat = parseFloat(atMatch[1])
      lng = parseFloat(atMatch[2])
    } else if (nameGuess && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(nameGuess)) {
      const [la, ln] = nameGuess.split(',')
      lat = parseFloat(la.trim())
      lng = parseFloat(ln.trim())
    }

    return { nameGuess, lat, lng, placeId }
  } catch {
    return {}
  }
}

async function resolveShortMapsUrl(originalUrl: string): Promise<string> {
  try {
    const input = new URL(originalUrl)
    if (!(input.host.includes('goo.gl') || input.host.includes('app.goo.gl'))) {
      return originalUrl
    }

    // First try not following to capture Location header
    const manual = await fetch(originalUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        // Pretend to be a mobile browser to get a final web URL
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      }
    } as RequestInit)
    const loc = manual.headers.get('location')
    if (loc) {
      const absolute = new URL(loc, manual.url).toString()
      return absolute
    }

    // Otherwise follow redirects and use the final URL
    const followed = await fetch(originalUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      }
    } as RequestInit)
    if (followed.url && !followed.url.includes('app.goo.gl')) return followed.url

    // Fallback: parse HTML for an embedded Google Maps URL
    try {
      const html = await followed.text()
      const patterns = [
        /(https:\/\/www\.google\.com\/maps\/place\/[^"'\s>]+)/i,
        /(https:\/\/maps\.google\.com\/\?q=[^"'\s>]+)/i,
        /"link"\s*:\s*"(https:\\\/\\\/www\\\.google\\\.com\\\/maps\\\/place\\\/[^\"]+)"/i
      ]
      for (const re of patterns) {
        const m = html.match(re)
        if (m && m[1]) {
          const candidate = m[1]
          // Unescape if came from JSON
          const cleaned = candidate.replace(/\\\//g, '/').replace(/&amp;/g, '&')
          return cleaned
        }
      }
    } catch {}

    return originalUrl
  } catch {
    return originalUrl
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing GOOGLE_PLACES_API_KEY' }, { status: 500 })
    }

    const body = (await req.json()) as ResolveBody
    const { url, name, lat, lng, placeId: fromClientPlaceId } = body
    if (!url && !name && !fromClientPlaceId) {
      return NextResponse.json({ error: 'Provide url, name, or placeId' }, { status: 400 })
    }

    // Expand short/share links (e.g., maps.app.goo.gl) by resolving redirects and nested link params
    let resolvedUrl = url
    if (url) {
      resolvedUrl = await resolveShortMapsUrl(url)
    }

    const parsed = resolvedUrl ? parseMapsUrl(resolvedUrl) : {}
    const inputText = name || parsed.nameGuess || url!

    // If we have a placeId from the URL, use Place Details for accuracy
    const chosenPlaceId = fromClientPlaceId || parsed.placeId
    if (chosenPlaceId) {
      const details = new URL('https://maps.googleapis.com/maps/api/place/details/json')
      details.searchParams.set('place_id', chosenPlaceId)
      details.searchParams.set('fields', 'place_id,name,formatted_address,geometry,url,types')
      details.searchParams.set('key', apiKey)
      const dResp = await fetch(details.toString())
      const dJson = await dResp.json()
      if (dResp.ok && dJson?.result) {
        const placeId: string = dJson.result.place_id
        const nameOut: string = dJson.result.name
        const formattedAddress: string | undefined = dJson.result.formatted_address
        const outLat: number | undefined = dJson.result.geometry?.location?.lat
        const outLng: number | undefined = dJson.result.geometry?.location?.lng
        const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`
        const types: string[] = Array.isArray(dJson.result.types) ? dJson.result.types : []
        const cuisine = deriveCuisine(types)
        return NextResponse.json({ placeId, name: nameOut, formattedAddress, lat: outLat, lng: outLng, googleMapsUrl, cuisine })
      }
      // fall through to text search if details fails
    }

    const search = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
    search.searchParams.set('input', inputText)
    search.searchParams.set('inputtype', 'textquery')
    search.searchParams.set('fields', 'place_id,name,geometry,url')
    search.searchParams.set('key', apiKey)
    const biasLat = lat ?? parsed.lat
    const biasLng = lng ?? parsed.lng
    if (biasLat !== undefined && biasLng !== undefined) {
      search.searchParams.set('locationbias', `circle:20000@${biasLat},${biasLng}`)
    }

    const resp = await fetch(search.toString())
    const data = await resp.json()
    if (!resp.ok) {
      return NextResponse.json({ error: 'Places lookup failed', details: data }, { status: 502 })
    }
    let candidate = data.candidates?.[0]
    if (!candidate) {
      // Fallback to Text Search if Find Place did not return candidates
      const text = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
      text.searchParams.set('query', inputText)
      text.searchParams.set('key', apiKey)
      if (biasLat !== undefined && biasLng !== undefined) {
        text.searchParams.set('location', `${biasLat},${biasLng}`)
        text.searchParams.set('radius', '20000')
      }
      const tResp = await fetch(text.toString())
      const tJson = await tResp.json()
      if (tResp.ok && Array.isArray(tJson.results) && tJson.results.length > 0) {
        const first = tJson.results[0]
        const placeIdT: string = first.place_id
        // Immediately fetch details to get canonical URL + address
        const details = new URL('https://maps.googleapis.com/maps/api/place/details/json')
        details.searchParams.set('place_id', placeIdT)
        details.searchParams.set('fields', 'place_id,name,formatted_address,geometry,url,types')
        details.searchParams.set('key', apiKey)
        const dResp = await fetch(details.toString())
        const dJson = await dResp.json()
        if (dResp.ok && dJson?.result) {
          const nameOutT: string = dJson.result.name
          const formattedAddressT: string | undefined = dJson.result.formatted_address
          const outLatT: number | undefined = dJson.result.geometry?.location?.lat
          const outLngT: number | undefined = dJson.result.geometry?.location?.lng
          const googleMapsUrlT = `https://www.google.com/maps/place/?q=place_id:${placeIdT}`
          const types: string[] = Array.isArray(dJson.result.types) ? dJson.result.types : []
          const cuisine = deriveCuisine(types)
          return NextResponse.json({ placeId: placeIdT, name: nameOutT, formattedAddress: formattedAddressT, lat: outLatT, lng: outLngT, googleMapsUrl: googleMapsUrlT, cuisine })
        }
        return NextResponse.json({ error: 'No place details' }, { status: 404 })
      }
      return NextResponse.json({ error: 'No place found' }, { status: 404 })
    }

    const placeId: string = candidate.place_id
    // Fetch details to include address
    const details = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    details.searchParams.set('place_id', placeId)
    details.searchParams.set('fields', 'place_id,name,formatted_address,geometry,url,types')
    details.searchParams.set('key', apiKey)
    const dResp = await fetch(details.toString())
    const dJson = await dResp.json()
    if (dResp.ok && dJson?.result) {
      const nameOut: string = dJson.result.name
      const formattedAddress: string | undefined = dJson.result.formatted_address
      const outLat: number | undefined = dJson.result.geometry?.location?.lat
      const outLng: number | undefined = dJson.result.geometry?.location?.lng
      const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`
      const types: string[] = Array.isArray(dJson.result.types) ? dJson.result.types : []
      const cuisine = deriveCuisine(types)
      return NextResponse.json({ placeId, name: nameOut, formattedAddress, lat: outLat, lng: outLng, googleMapsUrl, cuisine })
    }
    return NextResponse.json({ error: 'No place details' }, { status: 404 })
  } catch (e) {
    console.error('Error resolving place:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Map Google Place types to a simple cuisine guess
function deriveCuisine(types: string[]): string | undefined {
  const cuisineMap: Record<string, string> = {
    'indian_restaurant': 'Indian',
    'italian_restaurant': 'Italian',
    'thai_restaurant': 'Thai',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'korean_restaurant': 'Korean',
    'mexican_restaurant': 'Mexican',
    'vietnamese_restaurant': 'Vietnamese',
    'lebanese_restaurant': 'Lebanese',
    'turkish_restaurant': 'Turkish',
    'greek_restaurant': 'Greek',
    'spanish_restaurant': 'Spanish',
    'french_restaurant': 'French',
    'german_restaurant': 'German',
    'ethiopian_restaurant': 'Ethiopian',
    'pakistani_restaurant': 'Pakistani',
    'bangladeshi_restaurant': 'Bangladeshi',
    'sri_lankan_restaurant': 'Sri Lankan',
    'malaysian_restaurant': 'Malaysian',
    'indonesian_restaurant': 'Indonesian',
    'filipino_restaurant': 'Filipino',
    'brazilian_restaurant': 'Brazilian',
    'argentinian_restaurant': 'Argentinian',
    'portuguese_restaurant': 'Portuguese',
    'afghan_restaurant': 'Afghan',
    'moroccan_restaurant': 'Moroccan',
    'middle_eastern_restaurant': 'Middle Eastern',
    'seafood_restaurant': 'Seafood',
    'steak_house': 'Steakhouse',
    'vegan_restaurant': 'Vegan',
    'vegetarian_restaurant': 'Vegetarian',
    'pizza_restaurant': 'Pizza',
    'burger_restaurant': 'Burgers',
    'dessert_shop': 'Desserts',
    'coffee_shop': 'Coffee'
  }
  for (const t of types) {
    if (cuisineMap[t]) return cuisineMap[t]
  }
  // Fallback for generic restaurant
  if (types.includes('restaurant')) return 'Restaurant'
  return undefined
}


