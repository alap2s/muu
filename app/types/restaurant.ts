export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  dietaryRestrictions: string[]
}

export interface Restaurant {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  website: string
  menu: {
    categories: {
      name: string
      items: MenuItem[]
    }[]
  }
  menuSource?: 'database' | 'sample'
  lastUpdated?: string
  isHidden?: boolean
} 