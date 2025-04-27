import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { MenuItem } from '@/app/types/restaurant'

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

// Read the restaurant menu database with error handling
function getRestaurantMenus(): RestaurantDatabase {
  try {
    const filePath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
    console.log('Reading restaurant data from:', filePath)
    
    if (!fs.existsSync(filePath)) {
      console.error('Restaurant data file not found at:', filePath)
      throw new Error('Restaurant data file not found')
    }
    
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading restaurant data:', error)
    throw error
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

function transformMenuItemToFrontendFormat(menuItem: MenuItem): FrontendMenuItem {
  const dietaryRestrictions = menuItem.dietaryRestrictions || [];

  // Add dietary info flags to restrictions if they exist
  if (menuItem.dietaryInfo) {
    if (menuItem.dietaryInfo.isVegetarian) {
      dietaryRestrictions.push('vegetarian');
    }
    if (menuItem.dietaryInfo.isVegan) {
      dietaryRestrictions.push('vegan');
    }
    if (menuItem.dietaryInfo.hasVegetarianOption) {
      dietaryRestrictions.push('vegetarian-option');
    }
    if (menuItem.dietaryInfo.hasVeganOption) {
      dietaryRestrictions.push('vegan-option');
    }
  }

  return {
    id: menuItem.id,
    name: menuItem.name,
    description: menuItem.description || '',
    price: menuItem.price,
    category: menuItem.category || '',
    dietaryRestrictions: Array.from(new Set(dietaryRestrictions)) // Remove duplicates
  };
}

function transformToFrontendFormat(restaurant: RestaurantWithDistance): FrontendRestaurant {
  // Transform the categorized menu items into a flat array
  const menuItems = restaurant.menu.categories.flatMap(category => 
    category.items.map(item => ({
      ...transformMenuItemToFrontendFormat(item),
      category: category.name
    }))
  );

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

    // Get restaurant data
    const restaurantMenus = getRestaurantMenus()

    // Filter restaurants within the search radius
    const nearbyRestaurants = restaurantMenus.restaurants
      .map((restaurant: Restaurant) => ({
        ...restaurant,
        distance: calculateDistance(
          userLat,
          userLng,
          restaurant.coordinates.lat,
          restaurant.coordinates.lng
        )
      }))
      .filter((restaurant: RestaurantWithDistance) => restaurant.distance <= searchRadius)
      .sort((a: RestaurantWithDistance, b: RestaurantWithDistance) => a.distance - b.distance)
      .map(transformToFrontendFormat)

    console.log('Found restaurants:', nearbyRestaurants.map(r => ({
      name: r.name,
      distance: r.distance,
      menuItems: r.menu.length,
      menuSource: r.menuSource
    })))

    return NextResponse.json({ restaurants: nearbyRestaurants })
  } catch (error) {
    console.error('Error in restaurant API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 