'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc, GeoPoint, updateDoc } from 'firebase/firestore'
import { useViewMode } from '../../contexts/ViewModeContext'
import { Button } from '../../design-system/components/Button'
import { ArrowLeft, Edit, Loader2, Check, X } from 'lucide-react'
import { ListItem } from '../../design-system/components/ListItem'
import { Input } from '../../design-system/components/Input'

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

// A new interface for the editable form data
interface RestaurantFormData {
    name: string;
    address: string;
    website: string;
    notes: string;
}

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [formData, setFormData] = useState<RestaurantFormData>({ name: '', address: '', website: '', notes: '' });
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
          const restaurantData = { id: docSnap.id, ...docSnap.data() } as RestaurantDetails
          setRestaurant(restaurantData)
          // Initialize form data
          setFormData({
              name: restaurantData.name || '',
              address: restaurantData.address || '',
              website: restaurantData.website || '',
              notes: restaurantData.notes || '',
          });
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSave = async () => {
    if (!restaurantId) {
        setError("Cannot save, no restaurant ID found.");
        return;
    }
    setIsSaving(true);
    setError(null);
    try {
        const restaurantRef = doc(db, "restaurants", restaurantId);
        await updateDoc(restaurantRef, {
            name: formData.name,
            address: formData.address,
            website: formData.website,
            notes: formData.notes,
        });
        // Refresh local state after saving
        setRestaurant(prev => prev ? { ...prev, ...formData } : null);
        setIsEditing(false);
    } catch (err) {
        console.error("Error updating document: ", err);
        setError("Failed to save changes. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
      // Reset form data to original state
      if (restaurant) {
          setFormData({
              name: restaurant.name || '',
              address: restaurant.address || '',
              website: restaurant.website || '',
              notes: restaurant.notes || '',
          });
      }
      setIsEditing(false);
  }

  const renderDetailRow = (label: string, value?: string, fieldName?: keyof RestaurantFormData) => {
    if (!isEditing && !value) return null; // In view mode, hide if no value

    return (
      <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '8px 16px' }}>
          {isEditing && fieldName ? (
            <div className="flex flex-col w-full gap-1">
              <label className="text-xs font-mono" style={{ color: 'var(--text-secondary)'}}>{label}</label>
              <Input
                name={fieldName}
                value={formData[fieldName]}
                onChange={handleFormChange}
                className="w-full text-sm"
              />
            </div>
          ) : (
             <div className="flex flex-col w-full">
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)'}}>{label}</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)'}}>{value}</span>
             </div>
          )}
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>
    )
  }

  const allContent = restaurant ? [
    renderDetailRow('Name', restaurant.name, 'name'),
    renderDetailRow('Address', restaurant.address, 'address'),
    renderDetailRow('Website', restaurant.website, 'website'),
    renderDetailRow('Notes', restaurant.notes, 'notes'),
    ...(isEditing ? [] : [renderDetailRow('GPS', restaurant.gps ? `${restaurant.gps.latitude}, ${restaurant.gps.longitude}`: undefined)]),
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
          <Button variant="secondary" onClick={() => isEditing ? handleCancel() : router.back()} aria-label={isEditing ? "Cancel edit" : "Go back"}>
            {isEditing ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
          <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{isEditing ? 'Edit Details' : restaurant?.name || 'Details'}</h1>
          {isEditing ? (
            <Button variant="primary" onClick={handleSave} aria-label="Save changes" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)} aria-label="Edit restaurant details">
              <Edit className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
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