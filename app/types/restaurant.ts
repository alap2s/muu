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
} 