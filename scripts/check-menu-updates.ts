import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { Restaurant } from '../app/types'

interface MenuCheckResult {
  restaurantId: string
  hasUpdates: boolean
  lastChecked: string
}

async function checkMenuUpdates(): Promise<MenuCheckResult[]> {
  const menuPath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
  const restaurants: Restaurant[] = JSON.parse(fs.readFileSync(menuPath, 'utf-8')).restaurants

  const results: MenuCheckResult[] = []

  for (const restaurant of restaurants) {
    try {
      // Skip restaurants without a website
      if (!restaurant.website) continue

      // Get the last update time from the restaurant data
      const lastUpdated = restaurant.lastUpdated || '1970-01-01T00:00:00Z'

      // Check if the website has been updated since our last check
      const response = await axios.head(restaurant.website)
      const lastModified = response.headers['last-modified']

      if (lastModified && new Date(lastModified) > new Date(lastUpdated)) {
        results.push({
          restaurantId: restaurant.id,
          hasUpdates: true,
          lastChecked: new Date().toISOString()
        })
      } else {
        results.push({
          restaurantId: restaurant.id,
          hasUpdates: false,
          lastChecked: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error(`Error checking updates for ${restaurant.name}:`, error)
    }
  }

  return results
}

// Run the check
checkMenuUpdates()
  .then(results => {
    const updatesNeeded = results.filter(r => r.hasUpdates)
    if (updatesNeeded.length > 0) {
      console.log('Restaurants needing menu updates:', updatesNeeded)
      // Here you would trigger the actual menu update process
      // This could involve scraping the website or notifying an admin
    }
  })
  .catch(error => {
    console.error('Error checking menu updates:', error)
  }) 