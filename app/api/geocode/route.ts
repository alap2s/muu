import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  try {
    // Using OpenStreetMap's Nominatim service (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Menoo Restaurant Finder'
        }
      }
    )

    const data = await response.json()
    
    if (data.error) {
      return NextResponse.json({ error: 'Failed to get address' }, { status: 500 })
    }

    const address = data.display_name
    return NextResponse.json({ address })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Failed to get address' }, { status: 500 })
  }
} 