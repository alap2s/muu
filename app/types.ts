export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  dietaryRestrictions?: string[]
}

export interface Restaurant {
  id: string
  name: string
  address: string
  distance: number
  rating?: number
  priceLevel?: number
  openNow?: boolean
  photos?: { reference: string }[]
  menu?: MenuItem[]
  menuSource?: 'website' | 'sample'
  website?: string
  googleMapsUrl?: string
  cuisine?: string
  lastUpdated?: string
} 