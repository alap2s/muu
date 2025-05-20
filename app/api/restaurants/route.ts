import { NextResponse } from 'next/server'
import * as fs from 'fs/promises'
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
    const data = await fs.readFile(
      path.join(process.cwd(), 'data', 'restaurant-menus.json'),
      'utf-8'
    )
    restaurantMenus = JSON.parse(data)
    return restaurantMenus
  } catch (error) {
    console.error('Error loading restaurant data:', error)
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
    // Increase the search radius to 5km to show more restaurants
    const searchRadius = 5

    // Load restaurant data
    const restaurantData = await loadRestaurantData()
    if (!restaurantData) {
      throw new Error('Restaurant data not available')
    }

    // Calculate distance for each restaurant and filter by radius
    const filteredRestaurants = restaurantData.restaurants
      .map((restaurant: Restaurant) => ({
        ...restaurant,
        distance: calculateDistance(userLat, userLng, restaurant.coordinates.lat, restaurant.coordinates.lng)
      }))
      .filter((restaurant) => restaurant.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .map(transformToFrontendFormat)

    // If no restaurants found within radius, return all restaurants sorted by distance
    if (filteredRestaurants.length === 0) {
      const allRestaurants = restaurantData.restaurants
        .map((restaurant: Restaurant) => ({
          ...restaurant,
          distance: calculateDistance(userLat, userLng, restaurant.coordinates.lat, restaurant.coordinates.lng)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10) // Limit to 10 closest restaurants
        .map(transformToFrontendFormat)

      return NextResponse.json({ restaurants: allRestaurants })
    }

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