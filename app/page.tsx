'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Milk, Fish, Filter, ChevronDown, Bird, Egg, Beef, Nut, Layers, ChefHat, Squirrel } from 'lucide-react'

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const toggleItemExpansion = (itemId: string) => {
    const newExpandedItems = new Set(expandedItems)
    if (expandedItems.has(itemId)) {
      newExpandedItems.delete(itemId)
    } else {
      newExpandedItems.add(itemId)
    }
    setExpandedItems(newExpandedItems)
  }

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
      if (!menuRef.current) return

      const menuTop = menuRef.current.getBoundingClientRect().top
      const menuItems = Object.entries(categoryRefs.current)
      
      let closestCategory = ''
      let smallestDistance = Infinity

      for (const [category, element] of menuItems) {
        if (!element) continue
        
        const itemTop = element.getBoundingClientRect().top
        const distance = Math.abs(itemTop - menuTop - 100) // 100px offset from top
        
        if (distance < smallestDistance) {
          smallestDistance = distance
          closestCategory = category
        }
      }

      if (closestCategory && closestCategory !== selectedGroup) {
        setSelectedGroup(closestCategory)
      }
    }

    const menuElement = menuRef.current
    if (menuElement) {
      menuElement.addEventListener('scroll', handleScroll)
      return () => menuElement.removeEventListener('scroll', handleScroll)
    }
  }, [selectedGroup])

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

  const categories = Object.keys(groupedMenu)

  const getDietaryIcons = (item: MenuItem) => {
    const icons = []
    const name = item.name.toLowerCase()
    const description = item.description?.toLowerCase() || ''

    if (item.dietaryRestrictions.includes('vegetarian')) {
      icons.push(<Milk key="milk" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (item.dietaryRestrictions.includes('vegan')) {
      icons.push(<Leaf key="leaf" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (item.dietaryRestrictions.includes('nuts')) {
      icons.push(<Nut key="nut" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (!item.dietaryRestrictions.includes('vegetarian') && !item.dietaryRestrictions.includes('vegan')) {
      if (name.includes('chicken') || description.includes('chicken') || 
          name.includes('hähnchen') || description.includes('hähnchen')) {
        icons.push(<Bird key="bird" className="w-4 h-4 text-[#1e1e1e]" />)
      } else if (name.includes('egg') || description.includes('egg') ||
                 name.includes('ei') || description.includes('ei')) {
        icons.push(<Egg key="egg" className="w-4 h-4 text-[#1e1e1e]" />)
      } else if (name.includes('fish') || description.includes('fish') ||
                 name.includes('fisch') || description.includes('fisch')) {
        icons.push(<Fish key="fish" className="w-4 h-4 text-[#1e1e1e]" />)
      } else if (name.includes('ham') || description.includes('ham') ||
                 name.includes('schinken') || description.includes('schinken')) {
        icons.push(<Beef key="ham" className="w-4 h-4 text-[#1e1e1e]" />)
      } else {
        icons.push(<Bird key="meat" className="w-4 h-4 text-[#1e1e1e]" />)
      }
    }
    return icons
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <div className="flex">
        <div className="w-8 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
        <div className="flex-1 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8] flex items-center justify-center">
          <Squirrel className="w-6 h-6 text-[#6237FF]" />
        </div>
        <div className="w-8 h-12 bg-[#F4F2F8]" />
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading restaurants...</div>
      ) : restaurants.length > 0 ? (
        <div className="space-y-0">
          <div className="flex border-t border-[#6237FF]/20 border-b border-[#6237FF]/20">
            <div className="w-8 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
            <div className="flex-1">
              <div className="relative w-full">
                <select
                  className="w-full h-12 border-r border-[#6237FF]/20 pl-8 pr-4 appearance-none bg-[#F4F2F8] text-[#6237FF] truncate"
                  value={selectedRestaurant?.id || ''}
                  onChange={(e) => {
                    const restaurant = restaurants.find(r => r.id === e.target.value)
                    if (restaurant) setSelectedRestaurant(restaurant)
                  }}
                >
                  <option value="" disabled className="truncate">Select a restaurant</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id} className="truncate">
                      {restaurant.name} ({restaurant.distance} km away)
                    </option>
                  ))}
                </select>
                <ChefHat className="w-4 h-4 text-[#6237FF] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-[#6237FF] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="w-8 h-12 bg-[#F4F2F8]" />
          </div>

          {selectedRestaurant && (
            <div className="bg-[#F4F2F8]" ref={menuRef}>
              <div className="space-y-0">
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <div 
                    key={category} 
                    ref={el => categoryRefs.current[category] = el}
                  >
                    <div className="flex">
                      <div className="w-8 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                      <div className="flex-1">
                        <h3 className="font-medium text-[#6237FF] h-12 flex items-center px-4 border-r border-[#6237FF]/20 border-b border-[#6237FF]/20">
                          {category}
                        </h3>
                      </div>
                      <div className="w-8 h-12 bg-[#F4F2F8]" />
                    </div>
                    <div className="space-y-0">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="border-b border-[#6237FF]/20 cursor-pointer"
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          <div className="flex">
                            <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start p-4 border-r border-[#6237FF]/20">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-[#1e1e1e]">
                                      <span className={expandedItems.has(item.id) ? '' : 'line-clamp-1'}>
                                        {item.name}
                                      </span>
                                    </h4>
                                    <div className="flex gap-2 items-center">
                                      {getDietaryIcons(item)}
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className={`text-[#1e1e1e]/50 text-sm mt-1 ${expandedItems.has(item.id) ? '' : 'line-clamp-2'}`}>
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <span className="font-medium ml-4 text-[#1e1e1e]">
                                  €{item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="w-8 bg-[#F4F2F8]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedRestaurant.website && (
                <div className="mt-4 text-center pb-4">
                  <a
                    href={selectedRestaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6237FF] hover:underline"
                  >
                    Visit Restaurant Website
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="sticky bottom-0 bg-[#F4F2F8] z-10">
            <div className="flex border-t border-[#6237FF]/20 border-b border-[#6237FF]/20">
              <div className="w-8 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
              <div className="flex-1">
                <div className="flex">
                  {categories.length > 0 && (
                    <div className="relative flex-1">
                      <select
                        value={selectedGroup}
                        onChange={(e) => {
                          setSelectedGroup(e.target.value)
                          const element = categoryRefs.current[e.target.value]
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                        className="w-full h-12 border-r border-[#6237FF]/20 pl-8 pr-4 appearance-none bg-[#F4F2F8] text-[#6237FF] truncate"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category} className="truncate">
                            {category}
                          </option>
                        ))}
                      </select>
                      <Layers className="w-4 h-4 text-[#6237FF] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-4 h-4 text-[#6237FF] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                  <div className="relative flex-1">
                    <select
                      className="w-full h-12 border-r border-[#6237FF]/20 pl-8 pr-4 appearance-none bg-[#F4F2F8] text-[#6237FF] truncate"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all" className="truncate">All Items</option>
                      <option value="vegetarian" className="truncate">Vegetarian</option>
                      <option value="vegan" className="truncate">Vegan</option>
                    </select>
                    <Filter className="w-4 h-4 text-[#6237FF] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-4 h-4 text-[#6237FF] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="w-8 h-12 bg-[#F4F2F8]" />
            </div>
            <div className="flex border-b border-[#6237FF]/20">
              <div className="w-8 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
              <div className="flex-1 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
              <div className="w-8 h-12 bg-[#F4F2F8]" />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No restaurants found nearby
        </div>
      )}
    </div>
  )
} 