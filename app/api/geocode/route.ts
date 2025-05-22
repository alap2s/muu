import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MUU Restaurant Finder (muu@example.com)'  // Replace with your contact info
        }
      }
    )
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const { lat, lon: lng } = data[0]
      return NextResponse.json({ coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) } })
    } else {
      return NextResponse.json({ error: 'Could not geocode address' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error geocoding address:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 