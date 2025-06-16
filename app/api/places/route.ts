import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

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

    // Return empty array since we're using Google Places API as primary source
    return NextResponse.json([])
  } catch (error) {
    console.error('Error in places API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 