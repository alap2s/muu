'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Milk, Fish, Filter, ChevronDown, Bird, Egg, Beef, Nut, Layers, Store, Squirrel, List, Menu } from 'lucide-react'
import { Dropdown } from './design-system/components/Dropdown'
import { SettingsMenu } from './components/SettingsMenu'
import { A2HSBanner } from './components/A2HSBanner'
import Link from 'next/link'
import { Button } from './design-system/components/Button'
import { SettingsIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from './hooks/useIsMobile'

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
  const router = useRouter()
  const isMobile = useIsMobile()

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

    if (item.dietaryRestrictions.includes('vegan')) {
      icons.push(<Leaf key="leaf" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
    } else if (item.dietaryRestrictions.includes('vegetarian')) {
      icons.push(<Milk key="milk" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
    }
    if (item.dietaryRestrictions.includes('nuts')) {
      icons.push(<Nut key="nut" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
    }
    if (!item.dietaryRestrictions.includes('vegetarian') && !item.dietaryRestrictions.includes('vegan')) {
      if (name.includes('chicken') || description.includes('chicken') || 
          name.includes('hähnchen') || description.includes('hähnchen')) {
        icons.push(<Bird key="bird" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else if (name.includes('egg') || description.includes('egg') ||
                 name.includes('ei') || description.includes('ei')) {
        icons.push(<Egg key="egg" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else if (name.includes('fish') || description.includes('fish') ||
                 name.includes('fisch') || description.includes('fisch')) {
        icons.push(<Fish key="fish" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else if (name.includes('ham') || description.includes('ham') ||
                 name.includes('schinken') || description.includes('schinken')) {
        icons.push(<Beef key="ham" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else {
        icons.push(<Bird key="meat" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
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
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }}>
      {isMobile && <A2HSBanner />}
      {/* Notch spacer row for safe area */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }}>
        <div style={{ width: 32, borderRight: '1px solid var(--border-main)', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>
      <div
        className="flex flex-col sticky top-0 z-50"
        style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex justify-center">
          <div style={{ width: 32, height: 48, borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
          <div style={{ flex: 1, maxWidth: 1024, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, borderRight: '1px solid var(--border-main)', background: 'var(--background-main)', paddingLeft: 16, paddingRight: 0 }}>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Menoo</span>
            </div>
            <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
              <Button variant="secondary" onClick={() => router.push('/settings')}>
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div style={{ width: 32, height: 48, background: 'var(--background-main)' }} />
        </div>
        <div className="hidden md:flex justify-center" style={{ borderTop: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, height: 48, borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
          <div className="flex-1 flex min-w-0 max-w-4xl">
            <div className="flex-1 min-w-0">
              <Dropdown
                value={selectedRestaurant?.id || ''}
                onChange={(value) => {
                  const restaurant = restaurants.find(r => r.id === value)
                  if (restaurant) setSelectedRestaurant(restaurant)
                }}
                options={restaurants.map(restaurant => ({
                  value: restaurant.id,
                  label: `${restaurant.name} (<${restaurant.distance} km)`
                }))}
                leftIcon={<Store className="w-4 h-4" strokeWidth={2} />}
                position="bottom"
              />
            </div>
            <div className="flex-none w-12">
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
                leftIcon={<Layers className="w-4 h-4" strokeWidth={2} />}
                position="bottom"
                hideChevron={true}
                className="justify-center"
              />
            </div>
            <div className="flex-none w-12">
              <Dropdown
                value={filter}
                onChange={setFilter}
                options={[
                  { 
                    value: 'all', 
                    label: 'All',
                    leftContent: <Filter className="w-4 h-4" strokeWidth={2} />
                  },
                  { 
                    value: 'vegetarian', 
                    label: 'Vegetarian',
                    leftContent: <Milk className="w-4 h-4" strokeWidth={2} />
                  },
                  { 
                    value: 'vegan', 
                    label: 'Vegan',
                    leftContent: <Leaf className="w-4 h-4" strokeWidth={2} />
                  }
                ]}
                leftIcon={
                  filter === 'all' ? <Filter className="w-4 h-4" strokeWidth={2} /> :
                  filter === 'vegetarian' ? <Milk className="w-4 h-4" strokeWidth={2} /> :
                  <Leaf className="w-4 h-4" strokeWidth={2} />
                }
                position="bottom"
                align="right"
                hideChevron={true}
                className="justify-center"
              />
            </div>
          </div>
          <div style={{ width: 32, height: 48, background: 'var(--background-main)' }} />
        </div>
      </div>
      
      {error && (
        <div className="flex justify-center">
          <div className="max-w-4xl w-full">
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 mb-4">
              {error}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="max-w-4xl w-full text-center py-8">Loading restaurants...</div>
        </div>
      ) : restaurants.length > 0 ? (
        <div className="space-y-0">
          {selectedRestaurant && (
            <div className="bg-primary-light dark:bg-dark-background-main pb-20" ref={menuRef}>
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
                    <div className="flex justify-center">
                      <div style={{ width: 32, height: 48, borderRight: '1px solid var(--border-main)', borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
                      <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }}>
                        <h3 style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border-main)', borderBottom: '1px solid var(--border-main)', height: 48, display: 'flex', alignItems: 'center', paddingLeft: 16, textTransform: 'uppercase', fontWeight: 800, fontSize: 10 }}>{category}</h3>
                      </div>
                      <div style={{ width: 32, height: 48, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
                    </div>
                    <div className="space-y-0">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }}
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          <div className="flex justify-center">
                            <div style={{ width: 32, borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
                            <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: 16, borderRight: '1px solid var(--border-main)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, margin: 0 }}>
                                      <span className={expandedItems.has(item.id) ? '' : 'line-clamp-1'}>{item.name}</span>
                                    </h4>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{getDietaryIcons(item)}</div>
                                  </div>
                                  {item.description && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, marginBottom: 0 }} className={expandedItems.has(item.id) ? '' : 'line-clamp-2'}>{item.description}</p>
                                  )}
                                </div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: 16, fontSize: 14 }}>€{item.price.toFixed(2)}</span>
                              </div>
                            </div>
                            <div style={{ width: 32, background: 'var(--background-main)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedRestaurant.website && (
                <div>
                  <div className="flex justify-center">
                    <div className="w-8 md:w-[calc((100vw-1024px)/2)] border-r border-primary-border/10 dark:border-dark-primary-border/20 bg-primary-light dark:bg-dark-background-main" />
                    <div className="flex-1 h-12 flex items-center justify-center border-r border-primary-border/10 dark:border-dark-primary-border/20 max-w-4xl">
                      <a
                        href={selectedRestaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary dark:text-dark-text-primary hover:underline underline"
                      >
                        Visit Restaurant Website
                      </a>
                    </div>
                    <div className="w-8 md:w-[calc((100vw-1024px)/2)] bg-primary-light dark:bg-dark-background-main" />
                  </div>
                  <div className="flex justify-center h-8">
                    <div className="w-8 md:w-[calc((100vw-1024px)/2)] border-r border-primary-border/10 dark:border-dark-primary-border/20 bg-primary-light dark:bg-dark-background-main" />
                    <div className="flex-1 border-r border-primary-border/10 dark:border-dark-primary-border/20 bg-primary-light dark:bg-dark-background-main max-w-4xl" />
                    <div className="w-8 md:w-[calc((100vw-1024px)/2)] bg-primary-light dark:bg-dark-background-main" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: 'var(--background-main)' }}>
            <div className="max-w-4xl mx-auto">
              <div style={{ borderTop: '1px solid var(--border-main)' }}>
                <div className="flex w-full" style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <div style={{ width: 32, height: 48, borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
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
                          label: `${restaurant.name} (<${restaurant.distance} km)`
                        }))}
                        leftIcon={<Store className="w-4 h-4" strokeWidth={2} />}
                        position="top"
                      />
                    </div>
                    <div className="flex-none w-12">
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
                        leftIcon={<Layers className="w-4 h-4" strokeWidth={2} />}
                        position="top"
                        hideChevron={true}
                        className="justify-center"
                      />
                    </div>
                    <div className="flex-none w-12">
                      <Dropdown
                        value={filter}
                        onChange={setFilter}
                        options={[
                          { 
                            value: 'all', 
                            label: 'All',
                            leftContent: <Filter className="w-4 h-4" strokeWidth={2} />
                          },
                          { 
                            value: 'vegetarian', 
                            label: 'Vegetarian',
                            leftContent: <Milk className="w-4 h-4" strokeWidth={2} />
                          },
                          { 
                            value: 'vegan', 
                            label: 'Vegan',
                            leftContent: <Leaf className="w-4 h-4" strokeWidth={2} />
                          }
                        ]}
                        leftIcon={
                          filter === 'all' ? <Filter className="w-4 h-4" strokeWidth={2} /> :
                          filter === 'vegetarian' ? <Milk className="w-4 h-4" strokeWidth={2} /> :
                          <Leaf className="w-4 h-4" strokeWidth={2} />
                        }
                        position="top"
                        align="right"
                        hideChevron={true}
                        className="justify-center"
                      />
                    </div>
                  </div>
                  <div style={{ width: 32, height: 48, background: 'var(--background-main)' }} />
                </div>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-main)' }}>
                <div className="flex h-8">
                  <div className="w-8" style={{ borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
                  <div className="flex-1" style={{ borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
                  <div className="w-8" style={{ background: 'var(--background-main)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] space-y-4">
          <p className="text-primary/50 dark:text-dark-text-primary/70">No restaurants found nearby</p>
          <button
            type="button"
            className="h-12 px-4 appearance-none bg-primary-light dark:bg-dark-background-main text-primary dark:text-dark-primary font-mono flex items-center justify-center border border-primary-border/10 dark:border-dark-primary-border/20 hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors"
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