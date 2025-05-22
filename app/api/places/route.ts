import { NextResponse } from 'next/server'

interface OSMNode {
  id: number
  lat: number
  lon: number
  tags: {
    name: string
    amenity?: string
    cuisine?: string
    addr_street?: string
    addr_housenumber?: string
    addr_city?: string
    addr_postcode?: string
    website?: string
  }
}

interface OSMResponse {
  elements: OSMNode[]
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const lat = url.searchParams.get('lat')
    const lng = url.searchParams.get('lng')
    const radius = url.searchParams.get('radius')

    // Validate required parameters
    if (!lat || !lng || !radius) {
      return NextResponse.json(
        { error: `Missing required parameters: ${!lat ? 'lat' : ''} ${!lng ? 'lng' : ''} ${!radius ? 'radius' : ''}`.trim() },
        { status: 400 }
      )
    }

    // Validate coordinate values
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    const radiusNum = parseFloat(radius)

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) {
      return NextResponse.json(
        { error: 'Invalid coordinate or radius values. Please provide valid numbers.' },
        { status: 400 }
      )
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range. Latitude must be between -90 and 90, longitude between -180 and 180.' },
        { status: 400 }
      )
    }

    if (radiusNum <= 0 || radiusNum > 50000) {
      return NextResponse.json(
        { error: 'Radius must be between 0 and 50000 meters.' },
        { status: 400 }
      )
    }

    // Construct the Overpass API query
    const query = `[out:json][timeout:25];(node["amenity"="restaurant"](around:${radius},${lat},${lng});way["amenity"="restaurant"](around:${radius},${lat},${lng});relation["amenity"="restaurant"](around:${radius},${lat},${lng}););out body;>;out skel qt;`

    // Make the request to Overpass API
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: new URLSearchParams({
        data: query
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MUU Restaurant Finder'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenStreetMap API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch restaurants from OpenStreetMap' },
        { status: 500 }
      )
    }

    const data: OSMResponse = await response.json()

    // Transform the results to match our application's format
    const restaurants = data.elements
      .filter(node => node.tags?.name) // Only include restaurants with names
      .map(node => ({
        id: node.id.toString(),
        name: node.tags.name,
        address: [
          node.tags.addr_street,
          node.tags.addr_housenumber,
          node.tags.addr_city,
          node.tags.addr_postcode
        ].filter(Boolean).join(', '),
        coordinates: {
          lat: node.lat,
          lng: node.lon
        },
        website: node.tags.website,
        cuisine: node.tags.cuisine
      }))

    return NextResponse.json(restaurants)
  } catch (error) {
    console.error('Error in places API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 