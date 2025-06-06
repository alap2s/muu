'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Leaf, Milk, Fish, Filter, ChevronDown, Bird, Egg, Beef, Nut, Layers, Store, Squirrel, List, Menu, Building2, Globe, Map, Send, Plus, Settings } from 'lucide-react'
import { Dropdown } from './design-system/components/Dropdown'
import { SettingsMenu } from './components/SettingsMenu'
import { A2HSBanner } from './components/A2HSBanner'
import Link from 'next/link'
import { Button } from './design-system/components/Button'
import { SettingsIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from './hooks/useIsMobile'
import { ViewModeToggle } from './components/ViewModeToggle'
import { useViewMode } from './contexts/ViewModeContext'
import { usePrice } from './hooks/usePrice'
import { MenuItemRow } from './components/MenuItemRow'
import { Currency } from './context/CurrencyContext'
import { Input } from './design-system/components/Input'
import { useLoading } from './contexts/LoadingContext'

import { db } from '../lib/firebase';
import { collection, getDocs, query, GeoPoint as FirebaseGeoPoint } from 'firebase/firestore';


export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  dietaryRestrictions: string[]
  currency?: Currency
}

// This interface represents the structure of menu items as stored within menuCategories in Firestore
interface MenuItemFirestore {
  id: string;
  name: string;
  description?: string;
  price: number;
  // category field is on the parent MenuCategoryFirestore
  dietaryRestrictions: string[];
}

interface MenuCategoryFirestore {
  name: string;
  items: MenuItemFirestore[];
}

interface Restaurant {
  id: string; // Firestore document ID
  name: string;
  address: string;
  distance: number; // Calculated client-side
  website?: string;
  menu: MenuItem[]; // Reconstructed flat array for UI compatibility
  menuSource?: 'database' | 'sample';
  rating?: number;
  totalRatings?: number;
  notes?: string;
  originalJsonId: string; // ID from the original JSON file
  gps?: { latitude: number; longitude: number }; // For client-side use
  // menuCategories will be processed into the flat menu above
}

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180; // Convert degrees to radians
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(1)); // Return distance rounded to 1 decimal place
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
  const { viewMode, setViewMode } = useViewMode()
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [restaurantWebsite, setRestaurantWebsite] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showDescription, setShowDescription] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [initialDescriptionHeight, setInitialDescriptionHeight] = useState(0)
  const { setIsLoading } = useLoading()

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
      const scrollPosition = window.scrollY
      const maxScroll = 100 // Adjust this value to control how quickly the transition happens
      const progress = Math.min(scrollPosition / maxScroll, 1)
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
  }, [selectedGroup, menuRef, categoryRefs])

  useEffect(() => {
    if (descriptionRef.current) {
      setInitialDescriptionHeight(descriptionRef.current.scrollHeight)
    }
  }, [])

  const fetchRestaurants = async () => {
    if (!location) return

    setLoading(true)
    setError(null)

    try {
      const restaurantsQuery = query(collection(db, 'restaurants'));
      const querySnapshot = await getDocs(restaurantsQuery);
      
      const fetchedRestaurants: Restaurant[] = [];
      console.log('Firestore querySnapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        const data = doc.data() as {
          name: string;
          address: string;
          website?: string;
          gps?: FirebaseGeoPoint; 
          menuCategories: MenuCategoryFirestore[];
          originalJsonId: string;
          menuSource?: 'database' | 'sample';
          rating?: number;
          totalRatings?: number;
          notes?: string;
        };
        // console.log(`Processing Firestore doc ID: ${doc.id}, Name: ${data.name}`);
        // console.log('Raw menuCategories from Firestore:', data.menuCategories);

        let dist = Infinity;
        let gpsCoords: { latitude: number; longitude: number } | undefined = undefined;
        if (data.gps && location) { // Ensure location is available for distance calculation
          gpsCoords = { latitude: data.gps.latitude, longitude: data.gps.longitude };
          dist = calculateDistance(location.lat, location.lng, data.gps.latitude, data.gps.longitude);
        }

        const flatMenu: MenuItem[] = [];
        if (data.menuCategories && Array.isArray(data.menuCategories)) {
          data.menuCategories.forEach(category => {
            if (category.items && Array.isArray(category.items)) {
              category.items.forEach(item => {
                flatMenu.push({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  category: category.name, 
                  dietaryRestrictions: item.dietaryRestrictions || [],
                });
              });
            }
          });
        } else {
          // console.log(`No menuCategories found or not an array for ${data.name}`);
        }
        // console.log(`Constructed flatMenu for ${data.name}:`, flatMenu); 
        
        fetchedRestaurants.push({
          id: doc.id, 
          name: data.name,
          address: data.address,
          distance: dist,
          website: data.website,
          menu: flatMenu,
          menuSource: data.menuSource,
          rating: data.rating,
          totalRatings: data.totalRatings,
          notes: data.notes,
          originalJsonId: data.originalJsonId,
          gps: gpsCoords,
        });
      });

      // Filter restaurants within 1km radius
      const nearbyRestaurants = fetchedRestaurants.filter(r => r.distance <= 1);
      console.log(`Found ${fetchedRestaurants.length} total restaurants, ${nearbyRestaurants.length} within 1km.`);

      // Sort by distance and limit to closest 10 (or fewer if less than 10 available within 1km)
      const sortedRestaurants = nearbyRestaurants
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
      console.log('Final sorted and sliced restaurants:', sortedRestaurants.map(r => ({name: r.name, distance: r.distance})));

      setRestaurants(sortedRestaurants);
      if (sortedRestaurants.length > 0) {
        if (!selectedRestaurant || !sortedRestaurants.find(r => r.id === selectedRestaurant.id)) {
            setSelectedRestaurant(sortedRestaurants[0]);
            // Set initial category for the newly selected restaurant
            if (Array.isArray(sortedRestaurants[0].menu) && sortedRestaurants[0].menu.length > 0) {
                const categories = Array.from(new Set(sortedRestaurants[0].menu.map(item => item.category)))
                if (categories.length > 0) {
                setSelectedGroup(categories[0])
                }
            }
        }
      } else {
        setSelectedRestaurant(null);
        setRestaurants([]); // Clear restaurants if none are nearby
      }

    } catch (err) {
      console.error('Error fetching restaurants from Firestore:', err)
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
    if (item.dietaryRestrictions.includes('nuts') || name.includes('nuts') || description.includes('nuts')) {
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
                 name.includes('fisch') || description.includes('fisch') ||
                 name.includes('tuna') || description.includes('tuna')) {
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
          title: 'MUU',
          text: 'Accessible and personalized menus – check out MUU!',
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('print') === '1') {
        // Hide dropdowns and app name header before printing
        const dropdowns = document.querySelectorAll('.dropdown, .dropdown-trigger, .dropdown-content')
        dropdowns.forEach(el => (el as HTMLElement).style.display = 'none')
        const appNameHeader = document.querySelector('.app-name-header')
        if (appNameHeader) (appNameHeader as HTMLElement).style.display = 'none'
        setTimeout(() => {
          window.print()
          setTimeout(() => {
            dropdowns.forEach(el => (el as HTMLElement).style.display = '')
            if (appNameHeader) (appNameHeader as HTMLElement).style.display = ''
            params.delete('print')
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
            window.history.replaceState({}, '', newUrl)
          }, 500)
        }, 300)
      }
    }
  }, [])

  // Calculate dimensions based on scroll progress
  const logoHeight = 72 - (scrollProgress * 48) // 72px to 24px
  const logoWidth = (logoHeight / 72) * 210 // Maintain aspect ratio
  const verticalPadding = 48 - (scrollProgress * 36) // 48px to 12px
  const descriptionHeight = `${initialDescriptionHeight - (scrollProgress * initialDescriptionHeight)}px`

  const handleSettingsClick = () => {
    setIsLoading(true)
    router.replace('/settings')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      {isMobile && <A2HSBanner />}
      {/* Notch spacer row for safe area */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      {/* Status announcements for screen readers */}
      <div aria-live="polite" className="sr-only">
        {loading ? 'Loading restaurants...' : 
         error ? `Error: ${error}` :
         restaurants.length > 0 ? `Found ${restaurants.length} restaurants nearby` :
         'No restaurants found nearby'}
      </div>

      <header
        className="flex flex-col sticky top-0 z-50"
        style={{ 
          borderBottom: '1px solid var(--border-main)', 
          background: 'var(--background-main)', 
          paddingTop: 'env(safe-area-inset-top)'
        }}
      >
        <div className="flex justify-center">
          <div style={{ 
            width: 32, 
            borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', 
            background: 'var(--background-main)'
          }} />
          <div style={{ 
            flex: 1, 
            maxWidth: 800, 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between', 
            borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', 
            background: 'var(--background-main)'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start', 
              paddingTop: verticalPadding,
              paddingBottom: verticalPadding,
              paddingLeft: 16,
              paddingRight: 16,
              transition: 'padding 0.3s ease-out',
              borderRight: '1px solid var(--border-main)',
              willChange: 'padding-top, padding-bottom'
            }}>
              <svg 
                width={logoWidth}
                height={logoHeight}
                viewBox="0 0 210 73" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                style={{ 
                  display: 'block',
                  transition: 'width 0.3s ease-out, height 0.3s ease-out',
                  willChange: 'width, height'
                }}
              >
                <path d="M89.25 0.5V72.5H65.2933V21.4229H57.9343V72.5H31.3157V21.4229H23.9567V72.5H0V0.5H89.25Z" fill="var(--accent)"/>
                <path d="M150.15 72.5V0.5H126.03V51.5771H118.62V0.5H94.5V72.5H150.15Z" fill="var(--accent)"/>
                <path d="M210 72.5V0.5H186.335V51.5771H179.065V0.5H155.4V72.5H210Z" fill="var(--accent)"/>
              </svg>
              <div style={{ 
                height: descriptionHeight,
                overflow: 'hidden',
                transition: 'height 0.3s ease-out, opacity 0.3s ease-out',
                opacity: 1 - scrollProgress,
                willChange: 'height, opacity'
              }} ref={descriptionRef}>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: 12, 
                  marginTop: 2, 
                  marginBottom: 0,
                  paddingTop: 8,
                  paddingBottom: 8
                }}>
                  Standardized, accessible restaurant menus that remember your preferences.
                </p>
              </div>
            </div>
            <div style={{ 
              width: 48, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', 
              background: 'var(--background-main)'
            }}>
              <Button 
                variant="secondary" 
                onClick={handleSettingsClick}
                aria-label="Open settings menu"
              >
                <Menu className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div style={{ 
            width: 32, 
            background: 'var(--background-main)'
          }} />
        </div>
        <nav className="hidden md:flex justify-center" style={{ borderTop: '1px solid var(--border-main)' }} aria-label="Restaurant navigation">
          <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
          <div className="flex-1 flex min-w-0 max-w-[800px]">
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
                leftIcon={<Store className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
                position="bottom"
                aria-label="Select restaurant"
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
                leftIcon={<Layers className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
                position="bottom"
                hideChevron={true}
                className="justify-center"
                aria-label="Select menu category"
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
                    leftContent: <Filter className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  },
                  { 
                    value: 'vegetarian', 
                    label: 'Vegetarian',
                    leftContent: <Milk className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  },
                  { 
                    value: 'vegan', 
                    label: 'Vegan',
                    leftContent: <Leaf className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  }
                ]}
                leftIcon={
                  filter === 'all' ? <Filter className="w-4 h-4" strokeWidth={2} aria-hidden="true" /> :
                  filter === 'vegetarian' ? <Milk className="w-4 h-4" strokeWidth={2} aria-hidden="true" /> :
                  <Leaf className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                }
                position="bottom"
                align="right"
                hideChevron={true}
                className="justify-center"
                aria-label="Filter menu items"
              />
            </div>
          </div>
          <div style={{ width: 32, background: 'var(--background-main)' }} />
        </nav>
      </header>
      
      {error && (
        <div className="flex justify-center" role="alert">
          <div className="max-w-4xl w-full">
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 mb-4">
              {error}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center" role="status" aria-live="polite">
          <div className="max-w-4xl w-full text-center py-8">Loading restaurants...</div>
        </div>
      ) : restaurants.length > 0 ? (
        <div className="space-y-0">
          {selectedRestaurant && (
            <div className="bg-primary-light dark:bg-dark-background-main pb-20" ref={menuRef} role="region" aria-label={`${selectedRestaurant.name} menu`}>
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
                    <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                      <div
                        style={{
                          width: 32,
                          height: 48,
                          borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                          background: 'var(--background-main)'
                        }}
                      />
                      <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }}>
                        <h3 style={{ color: 'var(--text-primary)', height: 48, display: 'flex', alignItems: 'center', paddingLeft: 16, textTransform: 'uppercase', fontWeight: 800, fontSize: 10 }}>{category}</h3>
                      </div>
                      <div
                        style={{
                          width: 32,
                          height: 48,
                          borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                          background: 'var(--background-main)'
                        }}
                      />
                    </div>
                    <div className="space-y-0" role="list">
                      {items.map((item) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          expanded={expandedItems.has(item.id)}
                          onClick={toggleItemExpansion}
                          getDietaryIcons={getDietaryIcons}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedRestaurant.website && (
                <div
                  style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }}
                >
                  <div className="flex justify-center">
                    <div
                      style={{
                        width: 32,
                        borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                        background: 'var(--background-main)'
                      }}
                    />
                    <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Button
                          variant="secondary"
                          onClick={() => window.open(selectedRestaurant.website, '_blank', 'noopener,noreferrer')}
                          className="w-full"
                          aria-label={`Visit ${selectedRestaurant.name}'s website`}
                        >
                          Visit Restaurant Website
                        </Button>
                      </div>
                    </div>
                    <div
                      style={{
                        width: 32,
                        borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                        background: 'var(--background-main)'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: 'var(--background-main)' }}>
            <div className="max-w-4xl mx-auto">
              <div style={{ borderTop: '1px solid var(--border-main)' }}>
                <div className="flex w-full" style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
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
                  <div className="w-8" style={{ borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                  <div className="flex-1" style={{ borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                  <div className="w-8" style={{ background: 'var(--background-main)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="flex justify-center">
              <div
                style={{
                  width: 32,
                  height: i >= 1 && i <= 8 ? 'auto' : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
                  borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                  borderBottom: '1px solid var(--border-main)',
                  background: 'var(--background-main)'
                }}
                role="presentation"
              />
              <div style={{ flex: 1, maxWidth: 1024, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', height: i >= 1 && i <= 8 ? 48 : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)', position: 'relative' }}>
                {i === 1 && (
                  <div className="flex flex-col w-full px-3">
                    <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>No restaurants found in your area.</p>
                  </div>
                )}
                {i === 2 && (
                  <div className="flex flex-col w-full">
                    <Button
                      variant="secondary"
                      onClick={() => router.push('/menu-request')}
                      className="w-full"
                      aria-label="Request a new restaurant menu"
                    >
                      Request a new restaurant menu
                      <Plus className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
              <div
                style={{
                  width: 32,
                  height: i >= 1 && i <= 8 ? 'auto' : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
                  borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                  borderBottom: '1px solid var(--border-main)',
                  background: 'var(--background-main)'
                }}
                role="presentation"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 