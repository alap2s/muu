import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const address = formData.get('address') as string

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      )
    }

    // Create unique ID for the restaurant
    const restaurantId = uuidv4()

    // Create restaurant object (no menu)
    const restaurant = {
      id: restaurantId,
      name,
      address,
    }

    return NextResponse.json({ success: true, restaurant })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add restaurant' },
      { status: 500 }
    )
  }
} 