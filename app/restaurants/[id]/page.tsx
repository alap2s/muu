'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc, GeoPoint } from 'firebase/firestore'
import { useViewMode } from '../../contexts/ViewModeContext'
import { Button } from '../../design-system/components/Button'
import { ArrowLeft, Edit, Loader2 } from 'lucide-react'
import { ListItem } from '../../design-system/components/ListItem'

// Interfaces matching the Firestore structure
interface MenuItemFirestore {
  id: string;
  name: string;
  description?: string;
  price: number;
  dietaryRestrictions: string[];
}

interface MenuCategoryFirestore {
  name: string;
  items: MenuItemFirestore[];
}

interface RestaurantDetails {
  id: string;
  name: string;
  address: string;
  website?: string;
  notes?: string;
  gps?: GeoPoint;
  menuCategories: MenuCategoryFirestore[];
}

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { viewMode } = useViewMode()
  const { id: restaurantId } = params

  useEffect(() => {
    if (!restaurantId) {
      setError('No restaurant ID provided.')
      setLoading(false)
      return
    }

    const fetchRestaurantDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId)
        const docSnap = await getDoc(restaurantRef)

        if (docSnap.exists()) {
          setRestaurant({ id: docSnap.id, ...docSnap.data() } as RestaurantDetails)
        } else {
          setError('Restaurant not found.')
        }
      } catch (err) {
        console.error('Error fetching restaurant details:', err)
        setError('Failed to load restaurant details.')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantDetails()
  }, [restaurantId])

  const renderDetailRow = (label: string, value?: string) => {
    if (!value) return null;
    return (
      <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '8px 16px' }}>
          <div className="flex flex-col w-full">
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)'}}>{label}</span>
              <span className="text-sm" style={{ color: 'var(--text-primary)'}}>{value}</span>
          </div>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>
    )
  }

  const allContent = restaurant ? [
    renderDetailRow('Name', restaurant.name),
    renderDetailRow('Address', restaurant.address),
    renderDetailRow('Website', restaurant.website),
    renderDetailRow('Notes', restaurant.notes),
    renderDetailRow('GPS', restaurant.gps ? `${restaurant.gps.latitude}, ${restaurant.gps.longitude}`: undefined),
    ...(restaurant.menuCategories || []).flatMap(category => [
      // Category Header
      <div key={`cat-header-${category.name}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 16px' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{category.name}</h3>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>,
      // Menu Items
      ...category.items.map(item => (
        <div key={item.id} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0' }}>
              <ListItem title={item.name} subtitle={item.description} endContent={<span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{item.price}</span>} />
            </div>
            <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
      ))
    ])
  ].filter(Boolean) : [];

  const rowCount = Math.max(24, allContent.length);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800 }} />
        <div style={{ width: 32 }} />
      </div>

      <header className="flex justify-center" style={{ position: 'sticky', top: 'env(safe-area-inset-top)', zIndex: 10, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <Button variant="secondary" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
          <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{restaurant?.name || 'Details'}</h1>
          <Button variant="secondary" onClick={() => { /* Toggle Edit Mode in Phase 2 */ }} aria-label="Edit restaurant details">
            <Edit className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>

      <main className="space-y-0" style={{ height: `calc(100vh - 48px - env(safe-area-inset-top))`, overflowY: 'auto' }} role="region" aria-label="Restaurant details">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading Restaurant Details...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          [...Array(rowCount)].map((_, i) => allContent[i] || (
            <div key={`empty-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
                <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
                <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
          ))
        )}
      </main>
    </div>
  )
} 