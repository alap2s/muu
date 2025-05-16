import { NextRequest, NextResponse } from 'next/server'

// Simple rate limiting
const REQUESTS_PER_MINUTE = 3
const requestTimes: number[] = []

function canMakeRequest(): boolean {
  const now = Date.now()
  // Remove requests older than 1 minute
  while (requestTimes.length > 0 && requestTimes[0] < now - 60000) {
    requestTimes.shift()
  }
  return requestTimes.length < REQUESTS_PER_MINUTE
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    // Check rate limit
    if (!canMakeRequest()) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      )
    }

    // Add current request time
    requestTimes.push(Date.now())

    // Fetch the menu webpage
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch menu from URL: ${response.statusText}` },
        { status: response.status }
      )
    }
    const html = await response.text()

    // Placeholder response
    const menuItems = [
      {
        name: 'Placeholder Item',
        description: 'This is a placeholder item since OpenAI is not used.',
        price: 0,
        dietaryRestrictions: []
      }
    ]

    return NextResponse.json({ menuItems })
  } catch (error: any) {
    console.error('Error parsing menu from URL:', error)
    return NextResponse.json(
      { 
        error: 'Failed to parse menu from URL',
        details: error.message 
      }, 
      { status: 500 }
    )
  }
} 