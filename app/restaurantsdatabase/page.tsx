'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, orderBy, addDoc, GeoPoint } from 'firebase/firestore'
import { useViewMode } from '../contexts/ViewModeContext'
import { Button } from '../design-system/components/Button'
import { GridRow } from '../design-system/components/GridRow'
import { ArrowLeft, Loader2, Plus, Search, ChevronRight } from 'lucide-react'
import { Input } from '../design-system/components/Input'
import { ListItem } from '../design-system/components/ListItem'
import { v4 as uuidv4 } from 'uuid';
import { PageShell } from '../design-system/components/PageShell'
import { Header as DSHeader } from '../design-system/components/Header'
import { PageContentStack } from '../design-system/components/PageContentStack'

interface RestaurantInfo {
  id: string
  name: string
}

export default function RestaurantsDatabasePage() {
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
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

  const handleAddRestaurant = async () => {
    setAdding(true)
    setError(null)
    try {
      const newRestaurantRef = await addDoc(collection(db, 'restaurants'), {
        name: '',
        address: '',
        website: '',
        notes: '',
        menuCategories: [
          {
            id: uuidv4(),
            name: '',
            items: [
              {
                id: uuidv4(),
                name: '',
                description: '',
                price: 0,
                dietaryRestrictions: []
              }
            ]
          }
        ],
        gps: new GeoPoint(0, 0),
        menuSource: 'database',
        rating: 0,
        totalRatings: 0,
        originalJsonId: '',
        createdAt: new Date(), // Optional: for sorting by creation time
      });
      console.log('New restaurant created with ID:', newRestaurantRef.id)
      router.push(`/restaurants/${newRestaurantRef.id}/edit`)
    } catch (err) {
      console.error('Error creating new restaurant:', err)
      setError('Failed to create a new restaurant. Please try again.')
      setAdding(false)
    }
  }

  const rowCount = Math.max(24, filteredRestaurants.length + 2) // Ensure at least 24 rows

  return (
    <PageShell
      header={
        <DSHeader
          showRails={viewMode === 'grid'}
          borderBottom={false}
          left={
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          }
          right={
            <Button variant="secondary" onClick={handleAddRestaurant} disabled={adding} aria-label="Add new restaurant">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          }
          center={
            <div style={{ width: '100%', display: 'flex', justifyContent: 'left', padding: '0 16px' }}>
              <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>Database</h1>
            </div>
          }
        />
      }
    >
      <PageContentStack className="space-y-0" role="region" aria-label="Restaurant list">
        {/* Search row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div className="w-full" style={{ display: 'flex', alignItems: 'center' }}>
            <Input 
              icon={Search}
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </GridRow>

        {/* Content rows */}
        {loading ? (
          <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', minHeight: 48 }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading Restaurants...</span>
            </div>
          </GridRow>
        ) : error ? (
          <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <div className="flex items-center" style={{ minHeight: 48 }}>
              <p className="text-red-500">{error}</p>
            </div>
          </GridRow>
        ) : (
          [...Array(rowCount)].map((_, i) => (
            <GridRow key={i} showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0' }} className="min-w-0">
                {i < filteredRestaurants.length && (
                  <ListItem
                    title={filteredRestaurants[i].name}
                    subtitle={filteredRestaurants[i].id}
                    onClick={() => router.push(`/restaurants/${filteredRestaurants[i].id}`)}
                    endContent={<ChevronRight className="w-4 h-4" />}
                  />
                )}
              </div>
            </GridRow>
          ))
        )}
      </PageContentStack>
    </PageShell>
  )
} 