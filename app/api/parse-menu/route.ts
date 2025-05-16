import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
    }

    // Convert photos to base64
    const base64Photos = await Promise.all(
      photos.map(async (photo) => {
        const bytes = await photo.arrayBuffer()
        const buffer = Buffer.from(bytes)
        return buffer.toString('base64')
      })
    )

    // Prepare messages for GPT Vision
    const messages = [
      {
        role: 'system',
        content: 'You are a menu parsing assistant. Extract menu items from photos and return them in a structured format. Include item names, descriptions, prices, and dietary restrictions.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze these menu photos and extract all menu items. Return them in a JSON format with the following structure for each item: { name: string, description?: string, price: number, dietaryRestrictions?: string[] }. Group items by category.',
          },
          ...base64Photos.map((photo) => ({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${photo}`,
            },
          })),
        ],
      },
    ]

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
  } catch (error) {
    console.error('Error parsing menu:', error)
    return NextResponse.json({ error: 'Failed to parse menu' }, { status: 500 })
  }
} 