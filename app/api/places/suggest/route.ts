import { NextRequest, NextResponse } from 'next/server'

type SuggestBody = {
  input: string
  lat?: number
  lng?: number
  sessionToken?: string
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing GOOGLE_PLACES_API_KEY' }, { status: 500 })
    }

    const body = (await req.json()) as SuggestBody
    const { input, lat, lng, sessionToken } = body
    if (!input || input.trim().length < 1) {
      return NextResponse.json({ predictions: [] })
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.set('input', input)
    url.searchParams.set('key', apiKey)
    if (sessionToken) url.searchParams.set('sessiontoken', sessionToken)
    url.searchParams.set('types', 'establishment')
    if (lat !== undefined && lng !== undefined) {
      url.searchParams.set('location', `${lat},${lng}`)
      url.searchParams.set('radius', '20000')
    }

    const resp = await fetch(url.toString())
    const data = await resp.json()
    if (!resp.ok) {
      return NextResponse.json({ error: 'Autocomplete failed', details: data }, { status: 502 })
    }

    const predictions = (data.predictions || []).slice(0, 5).map((p: any) => ({
      placeId: p.place_id as string,
      primaryText: p.structured_formatting?.main_text as string || p.description as string,
      secondaryText: p.structured_formatting?.secondary_text as string || '',
      description: p.description as string
    }))

    return NextResponse.json({ predictions })
  } catch (e) {
    console.error('Error in places suggest:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


