import { NextResponse } from 'next/server'

interface PlaceResult {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
}

interface PlacesResponse {
  results: PlaceResult[]
  status: string
  next_page_token?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius')
  const pageToken = searchParams.get('pageToken')

  if (!lat || !lng || !radius) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
  }

  try {
    // Construct the URL for the Places API Nearby Search
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`
    
    // Add page token if provided
    if (pageToken) {
      url += `&pagetoken=${pageToken}`
    }

    // Make the request to Google Places API
    const response = await fetch(url)
    const data: PlacesResponse = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${data.status}`)
    }

    // Transform the results to match our application's format
    const restaurants = data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      totalRatings: place.user_ratings_total
    }))

    return NextResponse.json({
      restaurants,
      nextPageToken: data.next_page_token
    })
  } catch (error) {
    console.error('Error fetching places:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
} 