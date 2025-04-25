'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Vegan, Filter, ChevronDown } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  dietaryRestrictions: string[]
}

interface Restaurant {
  id: string
  name: string
  address: string
  distance: number
  website: string
  menu: MenuItem[]
  menuSource: 'database' | 'sample'
}

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isScrolling, setIsScrolling] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Unable to get your location. Please enable location access.')
        }
      )
    } else {
      setError('Geolocation is not supported by your browser.')
    }
  }, [])

  useEffect(() => {
    if (location) {
      fetchRestaurants()
    }
  }, [location])

  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0])
    }
  }, [restaurants])

  useEffect(() => {
    if (selectedRestaurant?.menu.length > 0) {
      const categories = Array.from(new Set(selectedRestaurant.menu.map(item => item.category)))
      if (categories.length > 0) {
        setSelectedGroup(categories[0])
      }
    }
  }, [selectedRestaurant])

  useEffect(() => {
    const handleScroll = () => {
      if (!menuRef.current || isScrolling) return

      const menuContainer = menuRef.current
      const scrollTop = menuContainer.scrollTop
      const containerHeight = menuContainer.clientHeight

      // Find the current visible group
      let currentGroup = ''
      for (const [group, ref] of Object.entries(groupRefs.current)) {
        if (ref) {
          const rect = ref.getBoundingClientRect()
          const menuRect = menuContainer.getBoundingClientRect()
          const relativeTop = rect.top - menuRect.top

          if (relativeTop <= 0 && relativeTop + rect.height > 0) {
            currentGroup = group
            break
          }
        }
      }

      if (currentGroup && currentGroup !== selectedGroup) {
        setSelectedGroup(currentGroup)
      }
    }

    const menuContainer = menuRef.current
    if (menuContainer) {
      menuContainer.addEventListener('scroll', handleScroll)
      return () => menuContainer.removeEventListener('scroll', handleScroll)
    }
  }, [selectedGroup, isScrolling])

  const scrollToGroup = (group: string) => {
    setIsScrolling(true)
    const groupElement = groupRefs.current[group]
    if (groupElement && menuRef.current) {
      const menuContainer = menuRef.current
      const groupTop = groupElement.offsetTop
      menuContainer.scrollTo({
        top: groupTop,
        behavior: 'smooth'
      })
      setSelectedGroup(group)
      setTimeout(() => setIsScrolling(false), 500)
    }
  }

  const fetchRestaurants = async () => {
    if (!location) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/restaurants?lat=${location.lat}&lng=${location.lng}&radius=0.5`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }

      const data = await response.json()
      setRestaurants(data.restaurants)
    } catch (err) {
      console.error('Error fetching restaurants:', err)
      setError('Failed to load restaurants. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const filteredMenu = selectedRestaurant?.menu.filter((item) => {
    if (filter === 'all') return true
    return item.dietaryRestrictions.includes(filter)
  })

  const groupedMenu = filteredMenu?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as { [key: string]: MenuItem[] }) || {}

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading restaurants...</div>
      ) : restaurants.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-auto">
              <select
                className="w-full sm:w-auto p-2 rounded border pl-8 pr-4 appearance-none bg-white"
                value={selectedRestaurant?.id || ''}
                onChange={(e) => {
                  const restaurant = restaurants.find(r => r.id === e.target.value)
                  if (restaurant) setSelectedRestaurant(restaurant)
                }}
              >
                <option value="" disabled>Select a restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} ({restaurant.distance} km away)
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                className="w-full sm:w-auto p-2 rounded border pl-8 pr-4 appearance-none bg-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Items</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
              <Filter className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {selectedRestaurant && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div
                ref={menuRef}
                className="overflow-y-auto max-h-[60vh] pr-4"
              >
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <div
                    key={category}
                    ref={(el) => (groupRefs.current[category] = el)}
                    className="mb-6"
                  >
                    <h3 className="text-xl font-semibold mb-3 sticky top-0 bg-white py-2">
                      {category}
                    </h3>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="border-b pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              {item.description && (
                                <p className="text-gray-600 text-sm mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <span className="font-medium">
                              €{item.price.toFixed(2)}
                            </span>
                          </div>
                          {item.dietaryRestrictions.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.dietaryRestrictions.includes('vegetarian') && (
                                <span className="flex items-center text-green-600 text-sm">
                                  <Leaf className="w-4 h-4 mr-1" />
                                  Vegetarian
                                </span>
                              )}
                              {item.dietaryRestrictions.includes('vegan') && (
                                <span className="flex items-center text-green-600 text-sm">
                                  <Vegan className="w-4 h-4 mr-1" />
                                  Vegan
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedRestaurant.website && (
                <div className="mt-4 text-center">
                  <a
                    href={selectedRestaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit Restaurant Website
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No restaurants found nearby
        </div>
      )}

      {Object.keys(groupedMenu).length > 0 && (
        <div className="fixed bottom-4 right-4">
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(e) => scrollToGroup(e.target.value)}
              className="appearance-none bg-white border rounded-lg p-3 pr-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(groupedMenu).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 