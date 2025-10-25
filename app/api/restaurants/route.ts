import { NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const idToken = req.headers.get('authorization')?.replace('Bearer ', '')
    const decoded = await verifyIdToken(idToken || undefined)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const allowed = ['name', 'address', 'website', 'notes', 'menuCategories', 'coordinates', 'isHidden'] as const
    const data: Record<string, any> = {}
    for (const k of allowed) {
      const v = body[k]
      if (v !== undefined) data[k] = v
    }
    data.createdAt = new Date()
    data.updatedAt = new Date()

    if (typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (typeof data.address !== 'string' || !data.address.trim()) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }
    if (data.coordinates) {
      const { lat, lng } = data.coordinates || {}
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
      }
    }

    const db = getAdminDb()
    const ref = await db.collection('restaurants').add(data)
    return NextResponse.json({ id: ref.id })
  } catch (e) {
    console.error('REST POST /restaurants error', e)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}

import * as fs from 'fs'
import * as path from 'path'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  dietaryRestrictions: string[]
}

interface MenuCategory {
  name: string
  items: MenuItem[]
}

interface Restaurant {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  website: string
  menu: {
    categories: MenuCategory[]
  }
}

interface RestaurantDatabase {
  restaurants: Restaurant[]
}

interface RestaurantWithDistance extends Restaurant {
  distance: number
}

interface FrontendMenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  dietaryRestrictions: string[]
}

interface FrontendRestaurant {
  id: string
  name: string
  address: string
  distance: number
  website: string
  menu: FrontendMenuItem[]
  menuSource: 'database' | 'sample'
}

// Read the restaurant menu database
let restaurantMenus: RestaurantDatabase | null = null

async function loadRestaurantData() {
  if (restaurantMenus) return restaurantMenus
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
    console.log('Attempting to read restaurant data from:', filePath)
    
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      console.error('Restaurant data file not found:', filePath)
      throw new Error('Restaurant data file not found')
    }
    
    // Use synchronous read for initial load
    const data = fs.readFileSync(filePath, 'utf-8')
    console.log('Successfully read restaurant data file')
    
    try {
      restaurantMenus = JSON.parse(data)
      if (!restaurantMenus || !Array.isArray(restaurantMenus.restaurants)) {
        console.error('Invalid restaurant data format:', restaurantMenus)
        throw new Error('Invalid restaurant data format')
      }
      console.log('Successfully parsed restaurant data, found', restaurantMenus.restaurants.length, 'restaurants')
      return restaurantMenus
    } catch (parseError) {
      console.error('Error parsing restaurant data:', parseError)
      throw new Error('Failed to parse restaurant data')
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw new Error('Failed to load restaurant data')
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return parseFloat((R * c).toFixed(1))
}

function transformToFrontendFormat(restaurant: RestaurantWithDistance): FrontendRestaurant {
  // Transform the categorized menu items into a flat array
  const menuItems = restaurant.menu.categories.flatMap(category => 
    category.items.map(item => ({
      ...item,
      category: category.name
    }))
  )

  return {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    distance: restaurant.distance,
    website: restaurant.website,
    menu: menuItems,
    menuSource: 'database'
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius')

  if (!lat || !lng || !radius) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const searchRadius = parseFloat(radius)

    if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Load restaurant data
    const restaurantData = await loadRestaurantData()
    if (!restaurantData) {
      throw new Error('Restaurant data not available')
    }

    // Log total restaurants loaded
    console.log('Total restaurants loaded:', restaurantData.restaurants.length);
    
    // Log restaurants with missing coordinates
    const invalidRestaurants = restaurantData.restaurants.filter((restaurant: Restaurant) => 
      !restaurant.coordinates || 
      typeof restaurant.coordinates.lat !== 'number' || 
      typeof restaurant.coordinates.lng !== 'number'
    );
    
    if (invalidRestaurants.length > 0) {
      console.warn('Found restaurants with invalid coordinates:', 
        invalidRestaurants.map(r => ({
          name: r.name,
          coordinates: r.coordinates
        }))
      );
    }

    // Filter out restaurants with missing/invalid coordinates
    const validRestaurants = restaurantData.restaurants.filter((restaurant: Restaurant) => 
      restaurant.coordinates && 
      typeof restaurant.coordinates.lat === 'number' && 
      typeof restaurant.coordinates.lng === 'number'
    );
    
    const skipped = restaurantData.restaurants.length - validRestaurants.length;
    if (skipped > 0) {
      console.warn(`Skipped ${skipped} restaurants due to missing/invalid coordinates.`);
    }

    // Calculate distance for each restaurant and filter by radius
    const filteredRestaurants = validRestaurants
      .map((restaurant: Restaurant) => ({
        ...restaurant,
        distance: calculateDistance(userLat, userLng, restaurant.coordinates.lat, restaurant.coordinates.lng)
      }))
      .filter((restaurant) => restaurant.distance <= searchRadius)
      .map(transformToFrontendFormat)

    console.log('Found restaurants:', filteredRestaurants.map(r => ({
      name: r.name,
      distance: r.distance,
      menuItems: r.menu.length,
      menuSource: r.menuSource
    })))

    return NextResponse.json({ restaurants: filteredRestaurants })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
} 