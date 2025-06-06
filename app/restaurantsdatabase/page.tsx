'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useViewMode } from '../contexts/ViewModeContext'
import { Button } from '../design-system/components/Button'
import { ArrowLeft, Loader2, ChevronRight, Search } from 'lucide-react'
import { Input } from '../design-system/components/Input'
import { ListItem } from '../design-system/components/ListItem'

interface RestaurantInfo {
  id: string
  name: string
}

export default function RestaurantsDatabasePage() {
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { viewMode } = useViewMode()

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true)
      setError(null)
      try {
        const restaurantsQuery = query(
          collection(db, 'restaurants'),
          orderBy('name', 'asc')
        )
        const querySnapshot = await getDocs(restaurantsQuery)
        const fetchedRestaurants: RestaurantInfo[] = []
        querySnapshot.forEach((doc) => {
          fetchedRestaurants.push({
            id: doc.id,
            name: doc.data().name || 'Unnamed Restaurant',
          })
        })
        setRestaurants(fetchedRestaurants)
      } catch (err) {
        console.error('Error fetching restaurants from Firestore:', err)
        setError('Failed to load restaurant database. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const rowCount = Math.max(24, filteredRestaurants.length + 2) // Ensure at least 24 rows

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      {/* Notch spacer */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800 }} />
        <div style={{ width: 32 }} />
      </div>

      {/* Header */}
      <header className="flex justify-center" style={{ position: 'sticky', top: 'env(safe-area-inset-top)', zIndex: 10, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Restaurant Database</h1>
          </div>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>
      
      {/* Search Bar */}
      <div className="flex justify-center" style={{ position: 'sticky', top: `calc(48px + env(safe-area-inset-top))`, zIndex: 9, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
          <Input 
            icon={Search}
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>

      {/* Content */}
      <main className="space-y-0" style={{ height: 'calc(100vh - 96px - env(safe-area-inset-top))', overflowY: 'auto' }} role="region" aria-label="Restaurant list">
        {loading ? (
          <div className="flex justify-center items-center h-full">
             <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)'}}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading Restaurants...</span>
             </div>
          </div>
        ) : error ? (
           <div className="flex justify-center items-center h-full">
             <p className="text-red-500">{error}</p>
           </div>
        ) : (
          [...Array(rowCount)].map((_, i) => (
            <div key={i} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0' }}>
                {i < filteredRestaurants.length && (
                  <ListItem
                    title={filteredRestaurants[i].name}
                    subtitle={filteredRestaurants[i].id}
                    onClick={() => router.push(`/restaurants/${filteredRestaurants[i].id}`)}
                  />
                )}
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
          ))
        )}
      </main>
    </div>
  )
} 