import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const update = await request.json()
    const { restaurantId, menu, lastUpdated } = update

    const menuPath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
    const data = JSON.parse(fs.readFileSync(menuPath, 'utf-8'))
    
    const restaurantIndex = data.restaurants.findIndex((r: any) => r.id === restaurantId)
    if (restaurantIndex === -1) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Update the restaurant's menu and lastUpdated timestamp
    data.restaurants[restaurantIndex].menu = menu
    data.restaurants[restaurantIndex].lastUpdated = lastUpdated

    // Write the updated data back to the file
    fs.writeFileSync(menuPath, JSON.stringify(data, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 