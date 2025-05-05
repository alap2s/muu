import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'

const execAsync = promisify(exec)

interface Restaurant {
  id: string
  name: string
  website: string
  lastUpdated?: string
  lastMenuHash?: string
  parser?: string // Name of the parser to use for this restaurant
}

interface MenuState {
  lastUpdated: string
  lastMenuHash: string
  menuSections: {
    [key: string]: string
  }
}

// Restaurant-specific parsers
const menuParsers: { [key: string]: (html: string) => { [key: string]: string } } = {
  // Default parser for most websites
  default: (html: string) => {
    const sections: { [key: string]: string } = {}
    const patterns = [
      { name: 'appetizers', regex: /<h2[^>]*>Appetizers<\/h2>.*?<ul[^>]*>(.*?)<\/ul>/is },
      { name: 'mains', regex: /<h2[^>]*>Main Courses<\/h2>.*?<ul[^>]*>(.*?)<\/ul>/is },
      { name: 'desserts', regex: /<h2[^>]*>Desserts<\/h2>.*?<ul[^>]*>(.*?)<\/ul>/is }
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern.regex)
      if (match) {
        sections[pattern.name] = match[1]
      }
    }

    return sections
  },

  // Example parser for a specific restaurant
  'wen-cheng': (html: string) => {
    const sections: { [key: string]: string } = {}
    const patterns = [
      { name: 'noodles', regex: /<h3[^>]*>Noodles<\/h3>.*?<div[^>]*class="menu-item"[^>]*>(.*?)<\/div>/gis },
      { name: 'rice', regex: /<h3[^>]*>Rice Dishes<\/h3>.*?<div[^>]*class="menu-item"[^>]*>(.*?)<\/div>/gis },
      { name: 'sides', regex: /<h3[^>]*>Sides<\/h3>.*?<div[^>]*class="menu-item"[^>]*>(.*?)<\/div>/gis }
    ]

    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern.regex)]
      if (matches.length > 0) {
        sections[pattern.name] = matches.map(m => m[1]).join('')
      }
    }

    return sections
  },

  // Add more restaurant-specific parsers here
}

async function getRestaurants(): Promise<Restaurant[]> {
  const menuPath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
  const data = JSON.parse(fs.readFileSync(menuPath, 'utf-8'))
  return data.restaurants
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function extractMenuSections(html: string, restaurant: Restaurant): { [key: string]: string } {
  const parser = restaurant.parser || 'default'
  const parseFunction = menuParsers[parser]
  
  if (!parseFunction) {
    console.warn(`No parser found for ${restaurant.name}, using default parser`)
    return menuParsers.default(html)
  }

  return parseFunction(html)
}

async function checkMenuChanges(restaurant: Restaurant): Promise<boolean> {
  try {
    const response = await axios.get(restaurant.website)
    const currentContent = response.data
    
    // Extract menu sections using the appropriate parser
    const currentSections = extractMenuSections(currentContent, restaurant)
    
    // Create a hash of the entire menu content
    const currentHash = hashContent(JSON.stringify(currentSections))
    
    // If this is the first check, store the hash and return false
    if (!restaurant.lastMenuHash) {
      await updateMenuHash(restaurant.id, currentHash)
      return false
    }
    
    // Compare with last known hash
    if (currentHash !== restaurant.lastMenuHash) {
      console.log(`Menu changes detected for ${restaurant.name}`)
      console.log('Changes in sections:', Object.keys(currentSections))
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error checking menu for ${restaurant.name}:`, error)
    return false
  }
}

async function updateMenuHash(restaurantId: string, hash: string) {
  try {
    const menuPath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
    const data = JSON.parse(fs.readFileSync(menuPath, 'utf-8'))
    
    const restaurant = data.restaurants.find((r: Restaurant) => r.id === restaurantId)
    if (restaurant) {
      restaurant.lastMenuHash = hash
      restaurant.lastUpdated = new Date().toISOString()
      fs.writeFileSync(menuPath, JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error(`Error updating menu hash for restaurant ${restaurantId}:`, error)
  }
}

async function updateMenu(restaurantId: string) {
  try {
    await execAsync(`ts-node scripts/update-menu.ts ${restaurantId}`)
  } catch (error) {
    console.error(`Error updating menu for restaurant ${restaurantId}:`, error)
  }
}

async function monitorMenus() {
  const restaurants = await getRestaurants()
  
  for (const restaurant of restaurants) {
    if (!restaurant.website) continue

    console.log(`Checking menu for ${restaurant.name}...`)
    const hasChanges = await checkMenuChanges(restaurant)
    
    if (hasChanges) {
      console.log(`Menu changes detected for ${restaurant.name}. Updating...`)
      await updateMenu(restaurant.id)
    } else {
      console.log(`No changes detected for ${restaurant.name}`)
    }
  }
}

// Run the monitor every hour
setInterval(monitorMenus, 60 * 60 * 1000)

// Initial run
monitorMenus()
  .then(() => console.log('Initial menu check completed'))
  .catch(error => console.error('Error during initial menu check:', error)) 