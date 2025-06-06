'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc, GeoPoint, updateDoc } from 'firebase/firestore'
import { useViewMode } from '../../contexts/ViewModeContext'
import { Button } from '../../design-system/components/Button'
import { ArrowLeft, Edit, Loader2, Check, X, Plus, Trash2 } from 'lucide-react'
import { ListItem } from '../../design-system/components/ListItem'
import { Input } from '../../design-system/components/Input'
import { v4 as uuidv4 } from 'uuid';

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
    menuCategories: MenuCategoryFirestore[];
}

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [formData, setFormData] = useState<RestaurantFormData>({ name: '', address: '', website: '', notes: '', menuCategories: [] });
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
              menuCategories: restaurantData.menuCategories || [],
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleMenuChange = (categoryIndex: number, itemIndex: number, field: keyof MenuItemFirestore, value: string | number) => {
      const newMenuCategories = [...formData.menuCategories];
      (newMenuCategories[categoryIndex].items[itemIndex] as any)[field] = value;
      setFormData(prev => ({ ...prev, menuCategories: newMenuCategories }));
  }

  const handleCategoryNameChange = (categoryIndex: number, value: string) => {
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].name = value;
    setFormData(prev => ({ ...prev, menuCategories: newMenuCategories }));
  }

  const addCategory = () => {
    const newCategory: MenuCategoryFirestore = {
      name: 'New Category',
      items: []
    };
    setFormData(prev => ({ ...prev, menuCategories: [...prev.menuCategories, newCategory] }));
  }

  const addItemToCategory = (categoryIndex: number) => {
    const newItem: MenuItemFirestore = {
      id: uuidv4(),
      name: 'New Item',
      description: '',
      price: 0,
      dietaryRestrictions: []
    };
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.push(newItem);
    setFormData(prev => ({ ...prev, menuCategories: newMenuCategories }));
  }

  const deleteCategory = (categoryIndex: number) => {
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories.splice(categoryIndex, 1);
    setFormData(prev => ({ ...prev, menuCategories: newMenuCategories }));
  }

  const deleteItem = (categoryIndex: number, itemIndex: number) => {
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.splice(itemIndex, 1);
    setFormData(prev => ({ ...prev, menuCategories: newMenuCategories }));
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
            menuCategories: formData.menuCategories,
        });
        // Refresh local state after saving
        setRestaurant(prev => prev ? { 
            ...prev,
            name: formData.name,
            address: formData.address,
            website: formData.website,
            notes: formData.notes,
            menuCategories: formData.menuCategories,
        } : null);
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
              menuCategories: restaurant.menuCategories || [],
          });
      }
      setIsEditing(false);
  }

  const renderDetailRow = (label: string, value?: string, fieldName?: keyof RestaurantFormData) => {
    if (!isEditing && !value) return null; // In view mode, hide if no value

    return (
      <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '8px 0' }}>
          {isEditing && fieldName ? (
            <div className="flex flex-col w-full gap-1 px-3">
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
    ...(isEditing ? formData.menuCategories : restaurant.menuCategories || []).flatMap((category, categoryIndex) => [
      // Category Header
      <div key={`cat-header-${category.name}-${categoryIndex}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 8px', justifyContent: 'space-between' }}>
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <Input value={category.name} onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)} className="font-semibold text-base flex-1" />
                <Button variant="secondary" onClick={() => addItemToCategory(categoryIndex)} aria-label="Add item to category">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="secondary" onClick={() => deleteCategory(categoryIndex)} aria-label="Delete category">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{category.name}</h3>
            )}
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>,
      // Menu Items
      ...category.items.map((item, itemIndex) => (
        <div key={item.id || `item-${categoryIndex}-${itemIndex}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 8px' }}>
              {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-2 py-2">
                    <Input placeholder="Item Name" value={item.name} onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'name', e.target.value)} />
                    <Input placeholder="Description" value={item.description || ''} onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'description', e.target.value)} />
                    <Input type="number" placeholder="Price" value={item.price} onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button variant="secondary" onClick={() => deleteItem(categoryIndex, itemIndex)} aria-label="Delete item">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <ListItem title={item.name} subtitle={item.description} endContent={<span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{item.price}</span>} />
              )}
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
          <>
            {[...Array(rowCount)].map((_, i) => allContent[i] || (
              <div key={`empty-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
                  <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
                  <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              </div>
            ))}
            {isEditing && (
                <div className="fixed bottom-0 right-0 p-4 z-50">
                    <Button variant="primary" onClick={addCategory} className="rounded-full h-14 w-14 shadow-lg flex items-center justify-center" aria-label="Add new category">
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  )
} 