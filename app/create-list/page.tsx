'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useViewMode } from '../contexts/ViewModeContext'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { X, Check, Plus, Trash2, Link, Store, MapPin, Utensils, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import React from 'react'

interface RestaurantEntry {
  id: string
  url: string
  name: string
  address: string
  cuisine: string
  isLoading: boolean
  error?: string
}

export default function CreateListPage() {
  const router = useRouter()
  const { viewMode } = useViewMode()
  const { user, loading: authLoading } = useAuth()
  const [restaurants, setRestaurants] = useState<RestaurantEntry[]>([
    { id: crypto.randomUUID(), url: '', name: '', address: '', cuisine: '', isLoading: false }
  ])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  const handleUrlChange = (id: string, url: string) => {
    const newRestaurants = restaurants.map(r => r.id === id ? { ...r, url } : r)
    setRestaurants(newRestaurants)
  }

  const handleFetchDetails = async (id: string, url: string) => {
    if (!url.trim()) return

    setRestaurants(restaurants.map(r => r.id === id ? { ...r, isLoading: true, error: undefined } : r))

    try {
      const response = await fetch(`/api/place-details?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch details')
      }

      setRestaurants(restaurants.map(r => r.id === id ? { ...r, name: data.name, address: data.address, cuisine: data.cuisine, isLoading: false } : r))
    } catch (error: any) {
      setRestaurants(restaurants.map(r => r.id === id ? { ...r, isLoading: false, error: error.message } : r))
    }
  }

  const handleAddRestaurant = () => {
    if (restaurants.length < 10) {
      setRestaurants([...restaurants, { id: crypto.randomUUID(), url: '', name: '', address: '', cuisine: '', isLoading: false }])
    }
  }

  const handleRemoveRestaurant = (id: string) => {
    setRestaurants(restaurants.filter(r => r.id !== id))
  }

  if (authLoading || !user) {
    // You can return a loading spinner or null here
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }}>
      {/* Header */}
      <header className="flex justify-center" style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <Button variant="secondary" onClick={() => router.back()} aria-label="Cancel">
            <X className="w-4 h-4" />
          </Button>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Create List</h1>
          <Button variant="primary" onClick={() => { /* Handle Save */ }} aria-label="Save list">
            <Check className="w-4 h-4" />
          </Button>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>

      {/* Main Content */}
      <main className="space-y-0">
        {/* Helper Text */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '12px 16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Add your top 10 favorite restaurants ever. Just paste google map links to them to populate data.
            </p>
          </div>
          <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
        
        {/* Spacer Row */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, height: 48 }} />
          <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>

        {/* Restaurant Entries */}
        {restaurants.map((restaurant, index) => (
          <React.Fragment key={restaurant.id}>
            {/* URL Input */}
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <Input 
                  icon={restaurant.isLoading ? Loader2 : Link} 
                  iconClassName={restaurant.isLoading ? 'animate-spin' : ''}
                  placeholder="Paste Google Maps Link" 
                  value={restaurant.url} 
                  onChange={(e) => handleUrlChange(restaurant.id, e.target.value)} 
                  onBlur={(e) => handleFetchDetails(restaurant.id, e.target.value)}
                  error={!!restaurant.error}
                  errorMessage={restaurant.error}
                />
                <Button variant="secondary" onClick={() => handleRemoveRestaurant(restaurant.id)} aria-label="Remove restaurant">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>

            {/* Name Input */}
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <Input icon={Store} placeholder="Restaurant Name" value={restaurant.name} readOnly />
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>

            {/* Address Input */}
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <Input icon={MapPin} placeholder="Address" value={restaurant.address} readOnly />
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
            
            {/* Cuisine Input */}
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <Input icon={Utensils} placeholder="Cuisine" value={restaurant.cuisine} readOnly />
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
            
            {/* Spacer after each restaurant block */}
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, height: 48 }} />
              <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
          </React.Fragment>
        ))}
        
        {/* Add Restaurant Button */}
        {restaurants.length < 10 && (
          <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', height: 48 }}>
              <Button
                variant="secondary"
                onClick={handleAddRestaurant}
                className="w-full justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            </div>
            <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          </div>
        )}
      </main>
    </div>
  )
}
