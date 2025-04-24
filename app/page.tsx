'use client'

import { useState, useEffect } from 'react'
import { MapPin, Leaf, Vegan, Filter, ChevronDown } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  dietaryRestrictions: string[]
}

interface Restaurant {
  id: string
  name: string
  distance: number
  address: string
  menu: MenuItem[]
}

interface Location {
  lat: number
  lng: number
  address: string
}

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [showRestaurantList, setShowRestaurantList] = useState(false)
  const [searchRadius, setSearchRadius] = useState(0.5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      const data = await response.json()
      return data.address
    } catch (error) {
      console.error('Error getting address:', error)
      return 'Location detected'
    }
  }

  const findNearbyRestaurants = async (userLat: number, userLng: number, radius: number) => {
    try {
      const response = await fetch(`/api/restaurants?lat=${userLat}&lng=${userLng}&radius=${radius}`)
      const data = await response.json()
      return data.restaurants
    } catch (error) {
      console.error('Error finding restaurants:', error)
      return []
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            setLoading(true)
            const { latitude, longitude } = position.coords
            const address = await getAddressFromCoordinates(latitude, longitude)
            setLocation({ lat: latitude, lng: longitude, address })

            // Start with a small radius and expand until we find enough restaurants
            let foundRestaurants: Restaurant[] = []
            let currentRadius = searchRadius

            while (foundRestaurants.length < 10 && currentRadius <= 5) {
              foundRestaurants = await findNearbyRestaurants(latitude, longitude, currentRadius)
              if (foundRestaurants.length < 10) {
                currentRadius += 0.5
                setSearchRadius(currentRadius)
              }
            }

            setRestaurants(foundRestaurants)
            if (foundRestaurants.length > 0) {
              setSelectedRestaurant(foundRestaurants[0])
            }
            setLoading(false)
          } catch (error) {
            setError('Failed to load restaurant data. Please try again later.')
            setLoading(false)
          }
        },
        (error) => {
          setError('Please enable location access to use this app.')
          setLoading(false)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
    }
  }, [])

  const getDietaryIcon = (restrictions: string[]) => {
    if (restrictions.includes('vegan')) {
      return <Vegan className="w-4 h-4 text-green-600" />
    } else if (restrictions.includes('vegetarian')) {
      return <Leaf className="w-4 h-4 text-green-600" />
    }
    return null
  }

  const filteredMenu = selectedRestaurant?.menu.filter((item) => {
    if (filter === 'all') return true
    return item.dietaryRestrictions.includes(filter)
  })

  if (error) {
    return (
      <main className="min-h-screen p-4 max-w-4xl mx-auto flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-gray-600">
          {location ? (
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {location.address}
            </span>
          ) : (
            'Loading your location...'
          )}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">
          Loading restaurants...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="relative">
              <button
                className="w-full p-4 rounded-lg bg-primary text-white flex justify-between items-center"
                onClick={() => setShowRestaurantList(!showRestaurantList)}
              >
                <div>
                  <h3 className="font-medium">{selectedRestaurant?.name}</h3>
                  <p className="text-sm opacity-80">{selectedRestaurant?.distance} km away</p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showRestaurantList ? 'rotate-180' : ''}`} />
              </button>
              
              {showRestaurantList && (
                <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className={`p-4 cursor-pointer hover:bg-gray-100 ${
                        selectedRestaurant?.id === restaurant.id ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setShowRestaurantList(false)
                      }}
                    >
                      <h3 className="font-medium">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600">{restaurant.distance} km away</p>
                      <p className="text-xs text-gray-500">{restaurant.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedRestaurant ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{selectedRestaurant.name}</h2>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <select
                      className="p-2 rounded border"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Items</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredMenu?.map((item) => (
                    <div key={item.id} className="p-4 bg-white rounded-lg shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <div className="flex gap-2 mt-2">
                            {getDietaryIcon(item.dietaryRestrictions)}
                          </div>
                        </div>
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No restaurants found in your area
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
} 