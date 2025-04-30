'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Milk, Fish, Filter, ChevronDown, Bird, Egg, Beef, Nut, Layers, Store, Squirrel, List } from 'lucide-react'
import { Dropdown } from './design-system/components/Dropdown'
import { SettingsMenu } from './components/SettingsMenu'

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
  menuSource?: 'database' | 'sample'
  rating?: number
  totalRatings?: number
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
  const [language, setLanguage] = useState<'EN' | 'DE'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as 'EN' | 'DE') || 'EN'
    }
    return 'EN'
  })
  const [notifications, setNotifications] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notifications') === 'true'
    }
    return false
  })

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
    if (selectedRestaurant && Array.isArray(selectedRestaurant.menu) && selectedRestaurant.menu.length > 0) {
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
      // Fetch restaurants from our database
      const dbResponse = await fetch(
        `/api/restaurants?lat=${location.lat}&lng=${location.lng}&radius=1`
      )

      if (!dbResponse.ok) {
        throw new Error('Failed to fetch restaurants from database')
      }

      const dbData = await dbResponse.json()
      
      // Only use restaurants from our database and limit to closest 10
      const allRestaurants = dbData.restaurants
        .filter((r: Restaurant) => r.menuSource === 'database')
        .sort((a: Restaurant, b: Restaurant) => a.distance - b.distance)
        .slice(0, 10)

      setRestaurants(allRestaurants)
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Menoo',
          text: 'Check out Menoo - A free app standardized restaurant menu app.',
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <div className="flex border-b border-[#FF373A]/20 sticky top-0 bg-[#F4F2F8] z-50">
        <div className="w-8 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
        <div className="flex-1 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8] flex items-center pl-4">
          <span className="text-[18px] font-bold text-[#FF373A]">Menoo</span>
        </div>
        <div className="w-12 h-12 bg-[#F4F2F8] flex-none">
          <SettingsMenu
            language={language}
            onLanguageChange={setLanguage}
            notifications={notifications}
            onNotificationsChange={setNotifications}
            onShare={handleShare}
          />
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
          {selectedRestaurant && (
            <div className="bg-[#F4F2F8] pb-20" ref={menuRef}>
              <div className="space-y-0">
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <div 
                    key={category} 
                    ref={(el) => {
                      if (categoryRefs.current) {
                        categoryRefs.current[category] = el
                      }
                    }}
                  >
                    <div className="flex">
                      <div className="w-8 h-12 border-r border-[#FF373A]/20 border-b border-[#FF373A]/20 bg-[#F4F2F8]" />
                      <div className="flex-1">
                        <h3 className="font-extrabold text-[10px] text-[#1e1e1e] h-12 flex items-center px-4 border-r border-[#FF373A]/20 border-b border-[#FF373A]/20 uppercase">
                          {category}
                        </h3>
                      </div>
                      <div className="w-8 h-12 border-b border-[#FF373A]/20 bg-[#F4F2F8]" />
                    </div>
                    <div className="space-y-0">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="border-b border-[#FF373A]/20 cursor-pointer"
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          <div className="flex">
                            <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start p-4 border-r border-[#FF373A]/20">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm text-[#1e1e1e]">
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
                <div>
                  <div className="flex">
                    <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                    <div className="flex-1 h-12 flex items-center justify-center border-r border-[#FF373A]/20">
                      <a
                        href={selectedRestaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1e1e1e] hover:underline underline"
                      >
                        Visit Restaurant Website
                      </a>
                    </div>
                    <div className="w-8 bg-[#F4F2F8]" />
                  </div>
                  <div className="flex h-8">
                    <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                    <div className="flex-1 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                    <div className="w-8 bg-[#F4F2F8]" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-primary-light z-50">
            <div className="max-w-4xl mx-auto">
              <div className="border-t border-[#FF373A]/20 border-b">
                <div className="flex w-full border-t border-[#FF373A]/20">
                  <div className="w-8 flex-none border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 flex min-w-0">
                    <div className="flex-1 min-w-0">
                      <Dropdown
                        value={selectedRestaurant?.id || ''}
                        onChange={(value) => {
                          const restaurant = restaurants.find(r => r.id === value)
                          if (restaurant) setSelectedRestaurant(restaurant)
                        }}
                        options={restaurants.map(restaurant => ({
                          value: restaurant.id,
                          label: `${restaurant.name} (${restaurant.distance} km)`
                        }))}
                        leftIcon={<Store className="w-4 h-4 text-[#FF373A]" strokeWidth={2} />}
                        position="top"
                      />
                    </div>
                    <div className="flex-none w-12 border-l border-[#FF373A]/20">
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
                        leftIcon={<Layers className="w-4 h-4 text-[#FF373A]" strokeWidth={2} />}
                        position="top"
                        hideChevron={true}
                        className="justify-center"
                      />
                    </div>
                    <div className="flex-none w-12 border-l border-[#FF373A]/20">
                      <Dropdown
                        value={filter}
                        onChange={setFilter}
                        options={[
                          { value: 'all', label: 'All' },
                          { value: 'vegetarian', label: 'Vegetarian' },
                          { value: 'vegan', label: 'Vegan' }
                        ]}
                        leftIcon={
                          filter === 'all' ? <Filter className="w-4 h-4 text-[#FF373A]" strokeWidth={2} /> :
                          filter === 'vegetarian' ? <Milk className="w-4 h-4 text-[#FF373A]" strokeWidth={2} /> :
                          <Leaf className="w-4 h-4 text-[#FF373A]" strokeWidth={2} />
                        }
                        position="top"
                        align="right"
                        hideChevron={true}
                        className="justify-center"
                      />
                    </div>
                  </div>
                  <div className="w-8 flex-none bg-[#F4F2F8]" />
                </div>
              </div>
              <div className="border-b border-[#FF373A]/20 hidden md:block">
                <div className="flex h-8">
                  <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] space-y-4">
          <p className="text-[#1e1e1e]/70">No restaurants found nearby</p>
          <button
            type="button"
            className="h-12 px-4 appearance-none bg-[#F4F2F8] text-[#FF373A] font-mono flex items-center justify-center border border-[#FF373A]/20 hover:bg-[#FF373A]/5 transition-colors"
            onClick={() => {
              // TODO: Implement add restaurant functionality
              console.log('Add restaurant clicked')
            }}
          >
            Add restaurant menu
          </button>
        </div>
      )}
    </div>
  )
} 