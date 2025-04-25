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

// Enhanced menu selectors for better scraping
const menuSelectors = [
  // Generic menu containers
  '.menu',
  '#menu',
  '[class*="menu"]',
  '[id*="menu"]',
  // Common menu section patterns
  '.menu-section',
  '.category',
  '.food-category',
  // Common menu item patterns
  '.menu-item',
  '.dish',
  '.food-item',
  // Price patterns
  '.price',
  '.item-price',
  '[class*="price"]',
  // Description patterns
  '.description',
  '.item-description',
  '[class*="description"]',
  // Common restaurant website patterns
  '.food-menu',
  '.restaurant-menu',
  '.online-menu',
  // Dynamic content patterns
  '[data-menu-item]',
  '[data-dish]',
  '[data-food-item]'
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

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  dietaryRestrictions?: string[];
}

interface MenuData {
  menu: MenuItem[];
  source: string;
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

async function extractStructuredData(url: string): Promise<MenuItem[]> {
  try {
    console.log('Extracting structured data from:', url);
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const menuItems: MenuItem[] = [];
    
    // Look for structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '');
        if (data.hasMenu || data['@type'] === 'Restaurant' || data.menu) {
          if (Array.isArray(data.hasMenu)) {
            data.hasMenu.forEach((item: any) => {
              if (item.name && item.offers?.price) {
                menuItems.push({
                  id: `structured-${menuItems.length}`,
                  name: item.name,
                  description: item.description,
                  price: parseFloat(item.offers.price),
                  category: item.category,
                  dietaryRestrictions: getDietaryRestrictions(item)
                });
              }
            });
          }
        }
      } catch (e) {
        console.error('Error parsing structured data:', e);
      }
    });
    
    console.log('Found structured menu items:', menuItems.length);
    return menuItems;
  } catch (error) {
    console.error('Error extracting structured data:', error);
    return [];
  }
}

function getDietaryRestrictions(item: any): string[] {
  const restrictions: string[] = [];
  const text = JSON.stringify(item).toLowerCase();
  
  if (text.includes('vegetarian')) restrictions.push('vegetarian');
  if (text.includes('vegan')) restrictions.push('vegan');
  if (text.includes('gluten-free') || text.includes('gluten free')) restrictions.push('gluten-free');
  if (text.includes('spicy') || text.includes('hot')) restrictions.push('spicy');
  
  return restrictions;
}

async function extractMenuFromWebsite(url: string): Promise<MenuItem[]> {
  try {
    console.log('Attempting to scrape menu from:', url);
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const menuItems: MenuItem[] = [];
    
    // Try each selector pattern
    for (const selector of menuSelectors) {
      console.log('Trying selector:', selector);
      const elements = $(selector);
      console.log('Found elements:', elements.length);
      
      elements.each((_, element) => {
        const $element = $(element);
        
        // Get text content and clean it
        const text = $element.text().trim().replace(/\s+/g, ' ');
        
        // Look for price patterns
        let price = 0;
        let name = '';
        
        // Try different price patterns
        const pricePatterns = [
          /[\$€£]\s*\d+\.?\d*/,
          /\d+\.?\d*\s*[\$€£]/,
          /\d+[.,]\d{2}/
        ];
        
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match) {
            price = parseFloat(match[0].replace(/[^\d.]/g, ''));
            name = text.replace(match[0], '').trim();
            break;
          }
        }
        
        // If no price found in text, look for specific price elements
        if (!price) {
          const priceElement = $element.find('[class*="price"], [class*="cost"], .amount').first();
          if (priceElement.length) {
            const priceText = priceElement.text().trim();
            const match = priceText.match(/[\$€£]?\s*\d+\.?\d*/);
            if (match) {
              price = parseFloat(match[0].replace(/[^\d.]/g, ''));
              name = text.replace(priceText, '').trim();
            }
          }
        }
        
        // Get description
        const description = $element.find('p, .description, [class*="desc"]').text().trim();
        
        // Get dietary restrictions
        const restrictions = getDietaryRestrictions({ description: text });
        
        if (name && price > 0) {
          menuItems.push({
            id: `item-${menuItems.length + 1}`,
            name,
            description: description || undefined,
            price,
            dietaryRestrictions: restrictions.length > 0 ? restrictions : undefined
          });
        }
      });
      
      // If we found items with this selector, stop trying others
      if (menuItems.length > 0) {
        console.log('Found menu items with selector:', selector);
        break;
      }
    }
    
    console.log('Total menu items found:', menuItems.length);
    return menuItems;
  } catch (error) {
    console.error('Error scraping menu from website:', error);
    return [];
  }
}

async function getMenuFromMultipleSources(restaurant: any): Promise<MenuData> {
  console.log(`Getting menu from multiple sources for: ${restaurant.name}`);
  console.log(`Restaurant website: ${restaurant.website}`);
  
  if (!restaurant.website) {
    console.log('No website available, using sample menu');
    return {
      menu: cuisineMenuItems[getCuisineType(restaurant)] || cuisineMenuItems.default,
      source: 'sample'
    };
  }

  try {
    // Try structured data first
    console.log('Attempting to extract structured data...');
    const structuredMenuItems = await extractStructuredData(restaurant.website);
    if (structuredMenuItems.length > 0) {
      console.log(`Found ${structuredMenuItems.length} menu items from structured data`);
      return {
        menu: structuredMenuItems,
        source: 'website'
      };
    }

    // Try website scraping
    console.log('Attempting to scrape website...');
    const scrapedMenuItems = await extractMenuFromWebsite(restaurant.website);
    if (scrapedMenuItems.length > 0) {
      console.log(`Found ${scrapedMenuItems.length} menu items from website scraping`);
      return {
        menu: scrapedMenuItems,
        source: 'website'
      };
    }

    // Fall back to sample menu
    console.log('No menu found from website, using sample menu');
    return {
      menu: cuisineMenuItems[getCuisineType(restaurant)] || cuisineMenuItems.default,
      source: 'sample'
    };
  } catch (error) {
    console.error('Error getting menu:', error);
    return {
      menu: cuisineMenuItems[getCuisineType(restaurant)] || cuisineMenuItems.default,
      source: 'sample'
    };
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
  
  if (data.status !== 'OK') {
    throw new Error('Failed to fetch from Google Places')
  }

  const restaurants = await Promise.all(data.results.map(async (place: any) => {
    console.log('Processing restaurant:', place.name)
    const details = await getGooglePlaceDetails(place.place_id)
    const restaurant = { ...place, ...details }
    
    // Get menu from multiple sources
    const menuData = await getMenuFromMultipleSources(restaurant)

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

export async function GET(request: Request) {
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