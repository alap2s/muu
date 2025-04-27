'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Milk, Fish, Filter, ChevronDown, Bird, Egg, Beef, Nut, Layers, ChefHat, Squirrel, Check, List } from 'lucide-react'
import { Dropdown, GridRow } from '@/app/design-system'
import { MenuItem } from './types/restaurant'

interface Restaurant {
  id: string
  name: string
  address: string
  distance: number
  website: string
  menu: MenuItem[]
  menuSource: 'database' | 'sample'
}

function getFilteredMenuItems(menu: MenuItem[], filter: string) {
  if (!filter || filter === 'all') return menu;
  return menu.filter(item => item?.dietaryRestrictions?.includes(filter) || false);
}

function getFilterCounts(menu: MenuItem[]) {
  return {
    all: menu.length,
    vegetarian: menu.filter(item => item?.dietaryRestrictions?.includes('vegetarian') || false).length,
    vegan: menu.filter(item => item?.dietaryRestrictions?.includes('vegan') || false).length
  };
}

function getCategoryItemCounts(menu: MenuItem[]) {
  const counts: Record<string, number> = {};
  menu.forEach(item => {
    if (item.category) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
  });
  return counts;
}

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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

      if (closestCategory && closestCategory !== selectedCategory) {
        setSelectedCategory(closestCategory)
      }
    }

    const menuElement = menuRef.current
    if (menuElement) {
      menuElement.addEventListener('scroll', handleScroll)
      return () => menuElement.removeEventListener('scroll', handleScroll)
    }
  }, [selectedCategory])

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

  const menu = selectedRestaurant?.menu || [];
  const filterCounts = getFilterCounts(menu);
  const filteredMenu = getFilteredMenuItems(menu, selectedFilter);
  const categoryItemCounts = getCategoryItemCounts(filteredMenu);

  const dietaryOptions = [
    { value: 'all', label: `All (${filterCounts.all})` },
    { value: 'vegetarian', label: `Vegetarian (${filterCounts.vegetarian})`, disabled: filterCounts.vegetarian === 0 },
    { value: 'vegan', label: `Vegan (${filterCounts.vegan})`, disabled: filterCounts.vegan === 0 }
  ];

  const categoryOptions = [
    { value: 'all', label: `All Categories (${filteredMenu.length})` },
    ...Array.from(new Set(filteredMenu.map(item => item.category)))
      .filter(category => category) // Filter out empty categories
      .map(category => ({
        value: category,
        label: `${category} (${categoryItemCounts[category] || 0})`
      }))
  ];

  const getDietaryIcons = (item: MenuItem) => {
    const icons = []
    const name = item.name.toLowerCase()
    const description = item.description?.toLowerCase() || ''
    const dietaryRestrictions = item.dietaryRestrictions || []

    if (dietaryRestrictions.includes('vegetarian')) {
      icons.push(<Milk key="milk" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (dietaryRestrictions.includes('vegan')) {
      icons.push(<Leaf key="leaf" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (dietaryRestrictions.includes('nuts')) {
      icons.push(<Nut key="nut" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (!dietaryRestrictions.includes('vegetarian') && !dietaryRestrictions.includes('vegan')) {
      if (name.includes('chicken') || description.includes('chicken') || 
          name.includes('hähnchen') || description.includes('hähnchen')) {
        icons.push(<Bird key="bird" className="w-4 h-4 text-[#1e1e1e]" />)
      }
    }
    if (name.includes('beef') || description.includes('beef') || 
        name.includes('rind') || description.includes('rind')) {
      icons.push(<Beef key="beef" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (name.includes('fish') || description.includes('fish') || 
        name.includes('fisch') || description.includes('fisch')) {
      icons.push(<Fish key="fish" className="w-4 h-4 text-[#1e1e1e]" />)
    }
    if (name.includes('egg') || description.includes('egg') || 
        name.includes('ei') || description.includes('ei')) {
      icons.push(<Egg key="egg" className="w-4 h-4 text-[#1e1e1e]" />)
    }

    return icons
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <div className="flex">
        <div className="w-8 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
        <div className="flex-1 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8] flex items-center justify-center">
          <Squirrel className="w-6 h-6 text-[#FF373A]" />
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
          <div className="flex border-t border-[#FF373A]/20 border-b border-[#FF373A]/20">
            <div className="w-8 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8] flex-none" />
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
              className="w-12 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8] text-[#FF373A] font-mono flex items-center justify-center flex-none"
              onClick={() => setLanguage(prev => prev === 'EN' ? 'DE' : 'EN')}
            >
              {language}
            </button>
            <div className="w-8 h-12 bg-[#F4F2F8]" />
          </div>

          {selectedRestaurant && (
            <div className="bg-[#F4F2F8] pb-20" ref={menuRef}>
              <div className="space-y-0">
                {Object.entries(filteredMenu.reduce((acc, item) => {
                  if (!acc[item.category]) {
                    acc[item.category] = []
                  }
                  acc[item.category].push(item)
                  return acc
                }, {} as { [key: string]: MenuItem[] })).length > 0 ? (
                  Object.entries(filteredMenu.reduce((acc, item) => {
                    if (!acc[item.category]) {
                      acc[item.category] = []
                    }
                    acc[item.category].push(item)
                    return acc
                  }, {} as { [key: string]: MenuItem[] })).map(([category, items]) => (
                    <div 
                      key={category} 
                      ref={el => categoryRefs.current[category] = el}
                    >
                      <div className="flex">
                        <div className="w-8 h-12 border-r border-b border-[#FF373A]/20 bg-[#F4F2F8]" />
                        <h3 className="flex-1 font-medium text-primary h-12 flex items-center px-4 border-r border-b border-[#FF373A]/20 font-mono">
                          {category}
                        </h3>
                        <div className="w-8 h-12 border-b border-[#FF373A]/20 bg-[#F4F2F8]" />
                      </div>
                      <div className="space-y-0">
                        {items.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex min-h-[64px] border-b border-[#FF373A]/20 cursor-pointer"
                            onClick={() => toggleItemExpansion(item.id)}
                          >
                            <div className="w-8 min-h-full border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                            <div className="flex-1 flex justify-between items-start p-4 border-r border-[#FF373A]/20 font-mono">
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
                  ))
                ) : (
                  <div className="flex flex-1">
                    <div className="w-8 h-full border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                    <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-[#FF373A]/20 min-h-[calc(100vh-13rem)]">
                      <Leaf className="w-12 h-12 text-[#FF373A]/40 mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">No items found</h3>
                      <p className="text-text-secondary text-center">
                        {selectedFilter === 'all' 
                          ? "This restaurant doesn't have any menu items yet."
                          : `No ${selectedFilter} items available. Try a different filter or check back later.`}
                      </p>
                    </div>
                    <div className="w-8 h-full bg-[#F4F2F8]" />
                  </div>
                )}
              </div>

              {selectedRestaurant.website && (
                <div className="flex h-12">
                  <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 border-r border-[#FF373A]/20 text-center flex items-center justify-center">
                    <a
                      href={selectedRestaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1e1e1e] hover:underline font-mono underline text-sm"
                    >
                      Visit Restaurant Website
                    </a>
                  </div>
                  <div className="w-8 bg-[#F4F2F8]" />
                </div>
              )}
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-primary-light z-50">
            <div className="max-w-4xl mx-auto">
              <div className="border-t border-[#FF373A]/20 border-b">
                <div className="flex w-full">
                  <div className="w-8 flex-none border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 flex min-w-0">
                    <div className="flex-1 min-w-0">
                      <Dropdown
                        value={selectedCategory}
                        onChange={(value) => {
                          setSelectedCategory(value)
                          const element = categoryRefs.current[value]
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                        options={categoryOptions}
                        leftIcon={<List className="w-4 h-4 text-primary" strokeWidth={2} />}
                        position="top"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Dropdown
                        value={selectedFilter}
                        onChange={(value) => setSelectedFilter(value)}
                        options={dietaryOptions}
                        leftIcon={<Filter className="w-4 h-4 text-primary" strokeWidth={2} />}
                        position="top"
                        align="right"
                      />
                    </div>
                  </div>
                  <div className="w-8 flex-none bg-[#F4F2F8]" />
                </div>
              </div>
              <div className="border-b border-[#FF373A]/20">
                <div className="flex h-8">
                  <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  <div className="flex-1 flex">
                    <div className="flex-1 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                    <div className="flex-1 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                  </div>
                  <div className="w-8 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
                </div>
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