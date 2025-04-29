import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

    // Prepare messages for GPT
    const messages = [
      {
        role: 'system',
        content: 'You are a menu parsing assistant. Extract menu items from HTML content and return them in a structured format. Include item names, descriptions, prices, and dietary restrictions.',
      },
      {
        role: 'user',
        content: `Please analyze this menu webpage and extract all menu items. Return them in a JSON format with the following structure for each item: { name: string, description?: string, price: number, dietaryRestrictions?: string[] }. Group items by category. Here's the HTML content:\n\n${html}`,
      },
    ]

    try {
      // Call GPT API with retries
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        max_tokens: 2048,
        temperature: 0.2,
      })

      // Validate the response format
      const content = completion.choices[0].message.content
      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      const menuItems = JSON.parse(content)
      if (!Array.isArray(menuItems) && typeof menuItems !== 'object') {
        throw new Error('Invalid menu items format')
      }

      return NextResponse.json({ menuItems })
    } catch (error: any) {
      if (error?.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      throw error
    }
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