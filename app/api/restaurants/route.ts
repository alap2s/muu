import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const OPENMENU_API_KEY = process.env.OPENMENU_API_KEY
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
const GOOGLE_PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'
const OPENMENU_API_URL = 'https://api.openmenu.com/v1'
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'

// Common menu items by cuisine type
const cuisineMenuItems: { [key: string]: any[] } = {
  italian: [
    { id: 'pizza-margherita', name: 'Pizza Margherita', description: 'Fresh tomatoes, mozzarella, basil', price: 12.99, category: 'Main Course', dietaryRestrictions: ['vegetarian'] },
    { id: 'pasta-pomodoro', name: 'Pasta al Pomodoro', description: 'Spaghetti with tomato sauce and basil', price: 11.99, category: 'Main Course', dietaryRestrictions: ['vegetarian'] },
    { id: 'tiramisu', name: 'Tiramisu', description: 'Classic Italian dessert', price: 6.99, category: 'Dessert', dietaryRestrictions: ['vegetarian'] }
  ],
  indian: [
    { id: 'butter-chicken', name: 'Butter Chicken', description: 'Creamy tomato curry with chicken', price: 14.99, category: 'Main Course', dietaryRestrictions: [] },
    { id: 'dal-tadka', name: 'Dal Tadka', description: 'Yellow lentils with spices', price: 10.99, category: 'Main Course', dietaryRestrictions: ['vegetarian', 'vegan'] },
    { id: 'veg-biryani', name: 'Vegetable Biryani', description: 'Fragrant rice with vegetables', price: 12.99, category: 'Main Course', dietaryRestrictions: ['vegetarian'] }
  ],
  chinese: [
    { id: 'kung-pao', name: 'Kung Pao Chicken', description: 'Spicy diced chicken with peanuts', price: 13.99, category: 'Main Course', dietaryRestrictions: [] },
    { id: 'mapo-tofu', name: 'Mapo Tofu', description: 'Spicy tofu in sauce', price: 11.99, category: 'Main Course', dietaryRestrictions: ['vegetarian'] },
    { id: 'veg-spring-rolls', name: 'Vegetable Spring Rolls', description: 'Crispy rolls with vegetables', price: 6.99, category: 'Appetizer', dietaryRestrictions: ['vegetarian', 'vegan'] }
  ],
  japanese: [
    { id: 'sushi-roll', name: 'California Roll', description: 'Crab, avocado, cucumber', price: 12.99, category: 'Main Course', dietaryRestrictions: [] },
    { id: 'veg-tempura', name: 'Vegetable Tempura', description: 'Assorted vegetables in crispy batter', price: 9.99, category: 'Appetizer', dietaryRestrictions: ['vegetarian'] },
    { id: 'miso-soup', name: 'Miso Soup', description: 'Traditional Japanese soup', price: 4.99, category: 'Soup', dietaryRestrictions: ['vegetarian'] }
  ],
  mediterranean: [
    { id: 'falafel-plate', name: 'Falafel Plate', description: 'Chickpea patties with hummus', price: 11.99, category: 'Main Course', dietaryRestrictions: ['vegetarian', 'vegan'] },
    { id: 'greek-salad', name: 'Greek Salad', description: 'Fresh vegetables with feta cheese', price: 9.99, category: 'Salad', dietaryRestrictions: ['vegetarian'] },
    { id: 'hummus', name: 'Hummus with Pita', description: 'Chickpea dip with bread', price: 6.99, category: 'Appetizer', dietaryRestrictions: ['vegetarian', 'vegan'] }
  ],
  default: [
    { id: 'house-salad', name: 'House Salad', description: 'Fresh mixed greens with vinaigrette', price: 8.99, category: 'Salad', dietaryRestrictions: ['vegetarian', 'vegan'] },
    { id: 'soup-day', name: 'Soup of the Day', description: 'Ask server for details', price: 6.99, category: 'Soup', dietaryRestrictions: [] },
    { id: 'veg-pasta', name: 'Vegetable Pasta', description: 'Pasta with seasonal vegetables', price: 12.99, category: 'Main Course', dietaryRestrictions: ['vegetarian'] }
  ]
}

// Common menu selectors for different website structures
const menuSelectors = [
  // Wen Cheng II specific selectors
  '.menu-list',           // Common in Chinese restaurant websites
  '.dish-list',          // Alternative for Chinese restaurants
  '.food-menu',          // Generic menu container
  '.menu-category',      // Menu sections
  '.menu-section',       // Alternative section selector
  // Common menu item patterns
  '.menu-item',
  '.menu__item',
  '.food-item',
  '.dish',
  '.item',
  // Specific restaurant platforms
  '.restaurant-menu-item',
  '.menu-section-item',
  '.menu-card',
  '.menu-list-item',
  // Generic patterns
  'article',
  '.product',
  '.menu-content',
  // Additional Chinese restaurant patterns
  '.chinese-menu',
  '.asian-menu',
  '.noodle-dishes',
  '.rice-dishes',
  '.soup-dishes'
]

// Price patterns to look for
const pricePatterns = [
  /\$\d+\.?\d*/,
  /£\d+\.?\d*/,
  /€\d+\.?\d*/,
  /\d+\.?\d*\s*(?:USD|EUR|GBP)/,
  /Price:\s*\d+\.?\d*/,
  /Cost:\s*\d+\.?\d*/
]

// Dietary restriction indicators
const dietaryIndicators = {
  vegetarian: ['vegetarian', 'veg', 'veggie'],
  vegan: ['vegan', 'plant-based'],
  glutenFree: ['gluten-free', 'gf'],
  dairyFree: ['dairy-free', 'df'],
  spicy: ['spicy', 'hot']
}

// Add these interfaces at the top of the file
interface Restaurant {
  id: string;
  name: string;
  distance: number;
  address: string;
  rating?: number;
  priceLevel?: number;
  openNow?: boolean;
  photos: Array<{ reference: string }>;
  menu: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    dietaryRestrictions?: string[];
  }>;
  menuSource: string;
  website?: string;
  googleMapsUrl?: string;
}

async function getOpenMenuData(restaurantName: string, address: string) {
  if (!OPENMENU_API_KEY) return null

  try {
    const response = await fetch(
      `${OPENMENU_API_URL}/menus/search?name=${encodeURIComponent(restaurantName)}&address=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `Bearer ${OPENMENU_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )
    const data = await response.json()
    
    if (data.menus && data.menus.length > 0) {
      return {
        menu: data.menus[0].items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          dietaryRestrictions: item.dietary_restrictions || []
        })),
        source: 'openmenu'
      }
    }
    return null
  } catch (error) {
    console.error('OpenMenu API error:', error)
    return null
  }
}

async function extractMenuFromWebsite(url: string) {
  try {
    console.log('Attempting to scrape menu from:', url)
    
    // Special handling for Wen Cheng website
    if (url.includes('wenchengnoodles.com')) {
      // Try to find the menu page URL
      const response = await fetch(url)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Look for the menu/food page link
      const menuLink = $('a[href*="food"], a[href*="menu"]').first().attr('href')
      if (menuLink) {
        const menuUrl = menuLink.startsWith('http') ? menuLink : new URL(menuLink, url).href
        console.log('Found menu page:', menuUrl)
        return await scrapeWenChengMenu(menuUrl)
      }
    }
    
    // Regular website scraping
    const response = await fetch(url)
    const html = await response.text()
    console.log('Website response status:', response.status)
    const $ = cheerio.load(html)
    
    const menuItems: any[] = []
    
    // Try each selector pattern
    for (const selector of menuSelectors) {
      console.log('Trying selector:', selector)
      const elements = $(selector)
      console.log('Found elements:', elements.length)
      
      elements.each((_, element) => {
        const $element = $(element)
        
        // Extract name (try different possible locations)
        const name = $element.find('h3, h4, .item-name, .dish-name, .title').text().trim() ||
                    $element.find('strong, b').text().trim() ||
                    $element.text().split('\n')[0].trim()
        
        if (!name) {
          console.log('No name found for element')
          return
        }
        
        // Extract description
        const description = $element.find('p, .description, .item-desc').text().trim() ||
                          $element.find('span:not(.price)').text().trim()
        
        // Extract price
        let price = 0
        const priceText = $element.find('.price, .cost, .amount').text().trim() ||
                         $element.text()
        
        for (const pattern of pricePatterns) {
          const match = priceText.match(pattern)
          if (match) {
            price = parseFloat(match[0].replace(/[^0-9.]/g, ''))
            break
          }
        }
        
        // Extract dietary restrictions
        const restrictions: string[] = []
        const text = $element.text().toLowerCase()
        
        for (const [restriction, indicators] of Object.entries(dietaryIndicators)) {
          if (indicators.some(indicator => text.includes(indicator))) {
            restrictions.push(restriction)
          }
        }
        
        // Only add if we found at least a name and price
        if (name && price > 0) {
          console.log('Found menu item:', { name, price, description })
          menuItems.push({
            id: `item-${menuItems.length + 1}`,
            name,
            description: description || undefined,
            price,
            dietaryRestrictions: restrictions.length > 0 ? restrictions : undefined
          })
        } else {
          console.log('Skipping item - missing name or price:', { name, price })
        }
      })
      
      // If we found items with this selector, stop trying others
      if (menuItems.length > 0) {
        console.log('Found menu items with selector:', selector)
        break
      }
    }
    
    console.log('Total menu items found:', menuItems.length)
    return {
      menu: menuItems,
      source: 'website'
    }
  } catch (error) {
    console.error('Error scraping menu from website:', error)
    return null
  }
}

async function scrapeWenChengMenu(url: string) {
  try {
    console.log('Scraping Wen Cheng menu from:', url)
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const menuItems: any[] = []
    
    // Based on the website structure, look for menu items
    $('.menu-item, .dish, .food-item').each((_, element) => {
      const $element = $(element)
      
      // Extract name
      const name = $element.find('h3, h4, .title').text().trim()
      if (!name) return
      
      // Extract description
      const description = $element.find('p, .description').text().trim()
      
      // Extract price
      let price = 0
      const priceText = $element.find('.price, .cost').text().trim()
      const priceMatch = priceText.match(/\d+\.?\d*/)
      if (priceMatch) {
        price = parseFloat(priceMatch[0])
      }
      
      // Extract dietary restrictions
      const restrictions: string[] = []
      const text = $element.text().toLowerCase()
      if (text.includes('vegetarian') || text.includes('veg')) restrictions.push('vegetarian')
      if (text.includes('vegan')) restrictions.push('vegan')
      if (text.includes('spicy') || text.includes('hot')) restrictions.push('spicy')
      
      if (name) {
        menuItems.push({
          id: `item-${menuItems.length + 1}`,
          name,
          description: description || undefined,
          price: price || 0,
          dietaryRestrictions: restrictions.length > 0 ? restrictions : undefined
        })
      }
    })
    
    // If no items found with specific selectors, try to find any text that looks like menu items
    if (menuItems.length === 0) {
      $('p, h3, h4').each((_, element) => {
        const text = $(element).text().trim()
        if (text && text.length > 3 && !text.includes('©') && !text.includes('reserved')) {
          menuItems.push({
            id: `item-${menuItems.length + 1}`,
            name: text,
            price: 0,
            source: 'website'
          })
        }
      })
    }
    
    console.log('Found Wen Cheng menu items:', menuItems.length)
    return {
      menu: menuItems,
      source: 'website'
    }
  } catch (error) {
    console.error('Error scraping Wen Cheng menu:', error)
    return null
  }
}

async function getGooglePlaceDetails(placeId: string) {
  if (!GOOGLE_API_KEY) {
    console.log('No Google API key found')
    return null
  }

  try {
    console.log('Fetching place details for:', placeId)
    const response = await fetch(
      `${GOOGLE_PLACE_DETAILS_URL}?place_id=${placeId}&fields=website,url,price_level,types,cuisine&key=${GOOGLE_API_KEY}`
    )
    const data = await response.json()
    console.log('Place details response:', JSON.stringify(data, null, 2))
    return data.result
  } catch (error) {
    console.error('Error fetching place details:', error)
    return null
  }
}

function getCuisineType(place: any): string {
  // Try to determine cuisine type from Google Places data
  const types = place?.types || []
  const cuisineMapping: { [key: string]: string } = {
    'restaurant_italian': 'italian',
    'restaurant_indian': 'indian',
    'restaurant_chinese': 'chinese',
    'restaurant_japanese': 'japanese',
    'restaurant_mediterranean': 'mediterranean'
  }

  for (const type of types) {
    if (cuisineMapping[type]) {
      return cuisineMapping[type]
    }
  }

  return 'default'
}

async function searchWithGooglePlaces(lat: string, lng: string, radius: number) {
  console.log('Searching Google Places with:', { lat, lng, radius })
  const response = await fetch(
    `${GOOGLE_PLACES_URL}?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`
  )
  const data = await response.json()
  console.log('Google Places search response:', JSON.stringify(data, null, 2))

  if (data.status !== 'OK') {
    throw new Error('Failed to fetch from Google Places')
  }

  const restaurants = await Promise.all(data.results.map(async (place: any) => {
    console.log('Processing restaurant:', place.name)
    const details = await getGooglePlaceDetails(place.place_id)
    const cuisineType = getCuisineType(details || place)
    
    let menuData = null
    
    // Try to get menu from website if available
    if (details?.website) {
      console.log('Found website for', place.name, ':', details.website)
      menuData = await extractMenuFromWebsite(details.website)
    } else {
      console.log('No website found for', place.name)
    }
    
    // If no menu data from website, use sample menu
    if (!menuData) {
      console.log('Using sample menu for', place.name)
      menuData = {
        menu: cuisineMenuItems[cuisineType] || cuisineMenuItems.default,
        source: 'sample'
      }
    }

    return {
      id: place.place_id,
      name: place.name,
      distance: calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      address: place.vicinity,
      rating: place.rating,
      priceLevel: place.price_level,
      openNow: place.opening_hours?.open_now,
      photos: place.photos?.map((photo: any) => ({
        reference: photo.photo_reference
      })) || [],
      menu: menuData.menu,
      menuSource: menuData.source,
      website: details?.website || null,
      googleMapsUrl: details?.url || null
    }
  }))

  return restaurants
}

async function searchWithOverpass(lat: string, lng: string, radius: number) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      way["amenity"="restaurant"](around:${radius},${lat},${lng});
      relation["amenity"="restaurant"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`
  })

  const data = await response.json()

  return data.elements
    .filter((element: any) => element.tags && element.tags.name)
    .map((element: any) => {
      const cuisine = element.tags.cuisine || 'default'
      const normalizedCuisine = cuisine.toLowerCase().includes('italian') ? 'italian'
        : cuisine.toLowerCase().includes('indian') ? 'indian'
        : cuisine.toLowerCase().includes('chinese') ? 'chinese'
        : cuisine.toLowerCase().includes('japanese') ? 'japanese'
        : cuisine.toLowerCase().includes('mediterranean') ? 'mediterranean'
        : 'default'

      return {
        id: element.id.toString(),
        name: element.tags.name,
        distance: calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          element.lat,
          element.lon
        ),
        address: [
          element.tags['addr:street'],
          element.tags['addr:housenumber']
        ].filter(Boolean).join(' '),
        cuisine: element.tags.cuisine,
        menu: cuisineMenuItems[normalizedCuisine] || cuisineMenuItems.default,
        menuSource: 'sample',
        website: element.tags.website || null
      }
    })
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

// Add this test function at the top of the file, after the imports
async function testWenChengSearch() {
  try {
    console.log('Testing Wen Cheng search...')
    
    // Coordinates for Berlin (where Wen Cheng is located)
    const lat = '52.52970739998559'
    const lng = '13.4115627923982'
    const radius = 500 // meters
    
    // Search for restaurants
    const response = await fetch(
      `${GOOGLE_PLACES_URL}?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`
    )
    const data = await response.json()
    
    // Find Wen Cheng in the results
    const wenCheng = data.results.find((place: any) => 
      place.name.toLowerCase().includes('wen cheng') || 
      place.name.toLowerCase().includes('wencheng')
    )
    
    if (wenCheng) {
      console.log('Found Wen Cheng:', wenCheng.name)
      console.log('Place ID:', wenCheng.place_id)
      
      // Get detailed information
      const detailsResponse = await fetch(
        `${GOOGLE_PLACE_DETAILS_URL}?place_id=${wenCheng.place_id}&fields=website,url,price_level,types,cuisine,name,formatted_address&key=${GOOGLE_API_KEY}`
      )
      const detailsData = await detailsResponse.json()
      
      console.log('Wen Cheng details:', JSON.stringify(detailsData.result, null, 2))
      
      if (detailsData.result.website) {
        console.log('Attempting to scrape menu from:', detailsData.result.website)
        const menuData = await extractMenuFromWebsite(detailsData.result.website)
        console.log('Menu data:', JSON.stringify(menuData, null, 2))
      }
    } else {
      console.log('Wen Cheng not found in search results')
      console.log('Search results:', data.results.map((r: any) => r.name))
    }
  } catch (error) {
    console.error('Test error:', error)
  }
}

// Modify the GET function to include the test
export async function GET(request: Request) {
  // Run the test first
  await testWenChengSearch()
  
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius')

  if (!lat || !lng || !radius) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    let restaurants: Restaurant[] = []
    const radiusInMeters = Math.floor(parseFloat(radius) * 1000)

    // Try Google Places API first
    if (GOOGLE_API_KEY) {
      try {
        restaurants = await searchWithGooglePlaces(lat, lng, radiusInMeters)
      } catch (error) {
        console.error('Google Places API error:', error)
        // Fall back to OpenStreetMap if Google Places fails
        restaurants = await searchWithOverpass(lat, lng, radiusInMeters)
      }
    } else {
      // Use OpenStreetMap if no Google API key is configured
      restaurants = await searchWithOverpass(lat, lng, radiusInMeters)
    }

    // Sort by distance
    restaurants.sort((a: Restaurant, b: Restaurant) => a.distance - b.distance)

    // Log the final restaurant data
    console.log('Final restaurant data:', JSON.stringify(restaurants.map((r: Restaurant) => ({
      name: r.name,
      website: r.website,
      menuSource: r.menuSource,
      menuItems: r.menu.length
    })), null, 2))

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error('Restaurant search error:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
} 