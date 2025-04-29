import fs from 'fs'
import path from 'path'
import axios from 'axios'

interface MenuUpdate {
  restaurantId: string
  menu: {
    categories: {
      name: string
      items: {
        id: string
        name: string
        description: string
        price: number
        dietaryRestrictions: string[]
      }[]
    }[]
  }
  lastUpdated: string
}

async function updateRestaurantMenu(restaurantId: string) {
  try {
    // Read the restaurant data
    const menuPath = path.join(process.cwd(), 'data', 'restaurant-menus.json')
    const data = JSON.parse(fs.readFileSync(menuPath, 'utf-8'))
    
    const restaurant = data.restaurants.find((r: any) => r.id === restaurantId)
    if (!restaurant) {
      throw new Error('Restaurant not found')
    }

    if (!restaurant.website) {
      throw new Error('Restaurant website not available')
    }

    // Fetch the menu from the restaurant's website
    const response = await axios.get(restaurant.website)
    const menuHtml = response.data

    // TODO: Implement menu parsing logic based on the restaurant's website structure
    // This will need to be customized for each restaurant's website format
    const newMenu = {
      categories: [] // Parse the menu from HTML and structure it according to our format
    }

    const update: MenuUpdate = {
      restaurantId,
      menu: newMenu,
      lastUpdated: new Date().toISOString()
    }

    // Send the update to our API
    await axios.post('http://localhost:3000/api/menu-update', update)

    console.log(`Successfully updated menu for restaurant ${restaurantId}`)
  } catch (error) {
    console.error(`Error updating menu for restaurant ${restaurantId}:`, error)
  }
}

// Example usage
if (require.main === module) {
  const restaurantId = process.argv[2]
  if (!restaurantId) {
    console.error('Please provide a restaurant ID')
    process.exit(1)
  }

  updateRestaurantMenu(restaurantId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
} 