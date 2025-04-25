'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Milk, Fish, Filter, ChevronDown, Bird, Egg, Beef, Nut, Layers, ChefHat, Squirrel, Check } from 'lucide-react'
import { Dropdown, GridRow } from '@/app/design-system'

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
  const [language, setLanguage] = useState<'EN' | 'DE'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as 'EN' | 'DE') || 'EN'
    }
    return 'EN'
  })
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language)
    }
  }, [language])

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
            <div className="w-8 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8] flex-none" />
            <div className="flex-1 min-w-0">
              <Dropdown
                value={selectedRestaurant?.id || ''}
                onChange={(value) => {
                  const restaurant = restaurants.find(r => r.id === value)
                  if (restaurant) setSelectedRestaurant(restaurant)
                }}
                options={restaurants.map(restaurant => ({
                  value: restaurant.id,
                  label: `${restaurant.name} (${restaurant.distance} km away)`
                }))}
                leftIcon={<ChefHat className="w-4 h-4 text-primary" strokeWidth={2} />}
                position="bottom"
              />
            </div>
            <button 
              className="w-12 h-12 border-r border-[#6237FF]/20 bg-[#F4F2F8] text-[#6237FF] font-mono flex items-center justify-center flex-none"
              onClick={() => setLanguage(prev => prev === 'EN' ? 'DE' : 'EN')}
            >
              {language}
            </button>
            <div className="w-8 h-12 bg-[#F4F2F8] flex-none" />
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
                      <div className="w-8 h-12 border-r border-b border-[#6237FF]/20 bg-[#F4F2F8]" />
                      <h3 className="flex-1 font-medium text-primary h-12 flex items-center px-4 border-r border-b border-[#6237FF]/20 font-mono">
                        {category}
                      </h3>
                      <div className="w-8 h-12 border-b border-[#6237FF]/20 bg-[#F4F2F8]" />
                    </div>
                    <div className="space-y-0">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex min-h-[64px] border-b border-[#6237FF]/20 cursor-pointer"
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          <div className="w-8 min-h-full border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                          <div className="flex-1 flex justify-between items-start p-4 border-r border-[#6237FF]/20 font-mono">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-text-primary">
                                  <span className={expandedItems.has(item.id) ? '' : 'line-clamp-1'}>
                                    {item.name}
                                  </span>
                                </h4>
                                <div className="flex gap-2 items-center">
                                  {getDietaryIcons(item)}
                                </div>
                              </div>
                              {item.description && (
                                <p className={`text-text-secondary text-sm mt-1 ${expandedItems.has(item.id) ? '' : 'line-clamp-2'}`}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <span className="font-medium ml-4 text-text-primary">
                              €{item.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-8 min-h-full bg-[#F4F2F8]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedRestaurant.website && (
                <div className="flex">
                  <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 border-r border-[#6237FF]/20 text-center py-4">
                    <a
                      href={selectedRestaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1e1e1e] hover:underline font-mono underline text-sm"
                    >
                      Visit Restaurant Website
                    </a>
                  </div>
                  <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                </div>
              )}
            </div>
          )}

          <div className="sticky bottom-0 bg-primary-light z-10">
            <div className="border-t border-[#6237FF]/20 border-b">
              <div className="flex">
                <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                <div className="flex-1 flex">
                  {categories.length > 0 && (
                    <div className="flex-1">
                      <Dropdown
                        value={selectedGroup}
                        onChange={(value) => {
                          setSelectedGroup(value)
                          const element = categoryRefs.current[value]
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                        options={categories.map(category => ({
                          value: category,
                          label: category
                        }))}
                        leftIcon={<Layers className="w-4 h-4 text-primary" strokeWidth={2} />}
                        position="top"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Dropdown
                      value={filter}
                      onChange={(value) => setFilter(value)}
                      options={[
                        { value: 'all', label: 'All Items' },
                        { value: 'vegetarian', label: 'Vegetarian' },
                        { value: 'vegan', label: 'Vegan' }
                      ]}
                      leftIcon={<Filter className="w-4 h-4 text-primary" strokeWidth={2} />}
                      position="top"
                      align="right"
                    />
                  </div>
                </div>
                <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
              </div>
            </div>
            <div className="border-b border-[#6237FF]/20">
              <div className="flex h-8">
                <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                <div className="flex-1 flex">
                  <div className="flex-1 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
                </div>
                <div className="w-8 border-r border-[#6237FF]/20 bg-[#F4F2F8]" />
              </div>
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