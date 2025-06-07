import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('CRITICAL: Google Maps API key is not configured on the server.')
    return NextResponse.json({ error: 'Server configuration error. Cannot validate address.' }, { status: 500 })
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK') {
      const result = data.results[0];
      const location = result.geometry.location
      const quality = result.geometry.location_type === 'APPROXIMATE' || result.partial_match ? 'approximate' : 'good';

      return NextResponse.json({ 
        latitude: location.lat, 
        longitude: location.lng,
        quality: quality
      });
    } else {
      let userMessage = 'An unknown error occurred while verifying the address.'
      switch (data.status) {
        case 'ZERO_RESULTS':
          userMessage = 'Address not found. Please check for typos or try a more specific address.'
          break
        case 'REQUEST_DENIED':
          userMessage = 'Could not verify address. The request was denied by the server.'
          console.error('Geocoding API request denied. This may be due to an invalid API key or incorrect billing setup.', data.error_message)
          break
        case 'INVALID_REQUEST':
          userMessage = 'Invalid request sent to the address verification service.'
          break
        case 'OVER_QUERY_LIMIT':
          userMessage = 'The address verification service is temporarily busy. Please try again in a few moments.'
          console.error('Geocoding API query limit exceeded.')
          break
      }
      return NextResponse.json({ error: userMessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching from Geocoding API:', error)
    return NextResponse.json({ error: 'Failed to connect to the address verification service. Check your network connection.' }, { status: 500 })
  }
} 