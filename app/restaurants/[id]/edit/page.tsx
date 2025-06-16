'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, GeoPoint, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore'
import { useViewMode } from '../../../contexts/ViewModeContext'
import { Button } from '../../../design-system/components/Button'
import { ArrowLeft, Edit, Loader2, Check, X, Plus, Trash2, Store, MapPin, Globe, NotepadText, FolderPlus, ListPlus, Undo2, LucideIcon, Copy } from 'lucide-react'
import { ListItem } from '../../../design-system/components/ListItem'
import { Input } from '../../../design-system/components/Input'
import { v4 as uuidv4 } from 'uuid';
import { useRef } from 'react';
import { Tabs } from '../../../design-system/components/Tabs'
import { TextArea } from '../../../design-system/components/TextArea'
import React from 'react';
import { Restaurant } from '@/types/restaurant';

// Interfaces matching the Firestore structure
interface MenuItemFirestore {
  id: string;
  name: string;
  description?: string;
  price: number;
  dietaryRestrictions: string[];
}

interface MenuCategoryFirestore {
  id: string;
  name: string;
  items: MenuItemFirestore[];
}

// A new interface for the editable form data
interface RestaurantFormData {
    name: string;
    address: string;
    website: string;
    notes: string;
    menuCategories: MenuCategoryFirestore[];
}

// Add new interface for JSON validation
interface MenuJson {
  menuCategories: MenuCategoryFirestore[];
}

type TabType = 'manual' | 'json';

interface RestaurantFirestore {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  menu: {
    categories: Array<{
      name: string;
      items: Array<{
        name: string;
        description: string;
        price: number;
      }>;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function RestaurantEditPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<RestaurantFormData | null>(null);
  const [originalAddress, setOriginalAddress] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For general form errors
  const [addressError, setAddressError] = useState<string | null>(null); // For address-specific validation
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [isNewRestaurant, setIsNewRestaurant] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null)

  // Refs and state for scrolling to new elements
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [newlyAddedCategoryIndex, setNewlyAddedCategoryIndex] = useState<number | null>(null);
  const [newlyAddedItem, setNewlyAddedItem] = useState<{ catIndex: number; itemIndex: number } | null>(null);
  
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
          const restaurantData = docSnap.data();
          if (!restaurantData.name) {
            setIsNewRestaurant(true);
          }
          // Initialize form data
          setFormData({
              name: restaurantData.name || '',
              address: restaurantData.address || '',
              website: restaurantData.website || '',
              notes: restaurantData.notes || '',
              menuCategories: restaurantData.menuCategories || [],
          });
          setOriginalAddress(restaurantData.address || '');
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

  useEffect(() => {
    if (newlyAddedCategoryIndex !== null && categoryRefs.current[newlyAddedCategoryIndex]) {
      const newCategoryElement = categoryRefs.current[newlyAddedCategoryIndex];
      newCategoryElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      const input = newCategoryElement?.querySelector('input');
      if (input) {
        setTimeout(() => input.focus(), 300); // Delay focus to allow smooth scroll to finish
      }

      setNewlyAddedCategoryIndex(null); // Reset after use
    }
  }, [newlyAddedCategoryIndex]);

  useEffect(() => {
    if (newlyAddedItem !== null) {
      const itemKey = `${newlyAddedItem.catIndex}-${newlyAddedItem.itemIndex}`;
      const newItemElement = itemRefs.current[itemKey];
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const input = newItemElement.querySelector('input');
        if (input) {
            setTimeout(() => input.focus(), 300); // Delay focus
        }
        
        setNewlyAddedItem(null); // Reset after use
      }
    }
  }, [newlyAddedItem]);

  // Add effect to update JSON input when form data changes or tab changes
  useEffect(() => {
    if (activeTab === 'json' && formData) {
      const menuJson: MenuJson = {
        menuCategories: formData.menuCategories
      };
      setJsonInput(JSON.stringify(menuJson, null, 2));
    }
  }, [activeTab, formData]);

  // Update the tab change handler
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'json' && formData) {
      const menuJson: MenuJson = {
        menuCategories: formData.menuCategories
      };
      setJsonInput(JSON.stringify(menuJson, null, 2));
    }
  };

  const validateField = (name: string, value: any) => {
    if (typeof value === 'string' && !value.trim()) {
      return true; // Error
    }
    if (typeof value === 'number' && value <= 0) {
      return true; // Error for price
    }
    return false; // No error
  };

  const handleBlur = (field: string, value: any, categoryId?: string, itemId?: string) => {
    const hasError = validateField(field, value);
    setFormErrors((prev: any) => {
      const newErrors = { ...prev };
      if (categoryId && itemId) {
        if (!newErrors[categoryId]) newErrors[categoryId] = { items: {} };
        if (!newErrors[categoryId].items) newErrors[categoryId].items = {};
        if (!newErrors[categoryId].items[itemId]) newErrors[categoryId].items[itemId] = {};
        newErrors[categoryId].items[itemId][field] = hasError;
      } else if (categoryId) {
        if (!newErrors[categoryId]) newErrors[categoryId] = {};
        newErrors[categoryId][field] = hasError;
      } else {
        newErrors[field] = hasError;
      }
      return newErrors;
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
      if (formErrors[name] && (name === 'name' || name === 'address')) {
        handleBlur(name, value);
      }
  }

  const handleMenuChange = (categoryIndex: number, itemIndex: number, field: keyof MenuItemFirestore, value: string | number) => {
      if (!formData) return;

      const newMenuCategories = [...formData.menuCategories];

      if (field === 'price') {
        const sanitizedValue = value.toString().replace(',', '.');
        const validPriceRegex = /^\d*(\.\d{0,2})?$/;
        if (sanitizedValue === '' || validPriceRegex.test(sanitizedValue)) {
          (newMenuCategories[categoryIndex].items[itemIndex] as any)[field] = sanitizedValue;
        }
      } else {
        (newMenuCategories[categoryIndex].items[itemIndex] as any)[field] = value;
      }
      
      setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));

      const categoryId = newMenuCategories[categoryIndex].id;
      const itemId = newMenuCategories[categoryIndex].items[itemIndex].id;
      if (formErrors[categoryId]?.items?.[itemId]?.[field] && categoryIndex === 0 && itemIndex === 0) {
        handleBlur(field, value, categoryId, itemId);
      }
  }

  const handleCategoryNameChange = (categoryIndex: number, value: string) => {
    if (!formData) return;
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].name = value;
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
    if (formErrors[newMenuCategories[categoryIndex].id]?.name && categoryIndex === 0) {
      handleBlur('name', value, newMenuCategories[categoryIndex].id);
    }
  }

  const addCategory = () => {
    if (!formData) return;
    const newCategory: MenuCategoryFirestore = {
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
    };
    
    const newMenuCategories = [...formData.menuCategories];
    const insertIndex = activeCategoryIndex === null ? newMenuCategories.length : activeCategoryIndex + 1;
    newMenuCategories.splice(insertIndex, 0, newCategory);

    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
    setActiveCategoryIndex(insertIndex);
    setNewlyAddedCategoryIndex(insertIndex);
  }

  const addItemToCategory = (categoryIndex: number) => {
    if (!formData || categoryIndex < 0 || categoryIndex >= formData.menuCategories.length) return;
    const newItem: MenuItemFirestore = {
      id: uuidv4(),
      name: '',
      description: '',
      price: 0,
      dietaryRestrictions: []
    };
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.push(newItem);
    const newItemIndex = newMenuCategories[categoryIndex].items.length - 1;
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
    setNewlyAddedItem({ catIndex: categoryIndex, itemIndex: newItemIndex });
  }

  const deleteCategory = (categoryIndex: number) => {
    if (!formData) return;
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories.splice(categoryIndex, 1);
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
  }

  const deleteItem = (categoryIndex: number, itemIndex: number) => {
    if (!formData) return;
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.splice(itemIndex, 1);
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
  }

  const handleAddressBlur = () => {
    // If the address is unchanged or empty, just clear any old errors and do nothing else.
    // This prevents the transition from running unnecessarily.
    if (!formData || formData.address === originalAddress || !formData.address) {
      setAddressError(null);
      setAddressWarning(null);
      return;
    }

    // Only start a transition if the address has actually changed.
    startTransition(async () => {
      setAddressError(null);
      setAddressWarning(null);

      try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
        const data = await response.json();

        if (!response.ok) {
          setAddressError(data.error || 'Could not verify address.');
        } else {
          if (data.quality === 'approximate') {
            setAddressWarning('Address is an approximate match. Please review or provide more detail.');
          } else {
            setAddressWarning(null);
          }
        }
      } catch (err) {
        setAddressError('Could not verify address. Please check your network connection.');
      }
    });
  };

  const handleSave = async () => {
    if (!formData) return;

    // If we're in JSON mode and there's an error, prevent saving
    if (activeTab === 'json' && jsonError) {
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.address) {
      setError('Name and address are required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // If we're in JSON mode, validate the JSON one more time before saving
      if (activeTab === 'json') {
        try {
          const parsedJson = JSON.parse(jsonInput) as MenuJson;
          if (!parsedJson.menuCategories || !Array.isArray(parsedJson.menuCategories)) {
            setError('Invalid menu JSON structure');
            return;
          }
        } catch (error) {
          setError('Invalid menu JSON format');
          return;
        }
      }

      // Rest of the save logic...
      const restaurantData: RestaurantFirestore = {
        name: formData.name,
        address: formData.address,
        coordinates: formData.coordinates,
        menuCategories: formData.menuCategories,
        notes: formData.notes || '',
        createdAt: formData.createdAt,
        updatedAt: new Date()
      };

      if (isNewRestaurant) {
        const docRef = await addDoc(collection(db, 'restaurants'), restaurantData);
        router.push(`/restaurants/${docRef.id}`);
      } else {
        await updateDoc(doc(db, 'restaurants', params.id), restaurantData);
        router.push(`/restaurants/${params.id}`);
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      setError('Failed to save restaurant. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (isNewRestaurant) {
      // For a new, unsaved restaurant, confirm before deleting the draft
      if (window.confirm('This will discard the new restaurant. Are you sure?')) {
        setIsCancelling(true);
        try {
          await deleteDoc(doc(db, 'restaurants', restaurantId));
          router.push('/restaurantsdatabase');
        } catch (err) {
          console.error('Error discarding new restaurant:', err);
          setError('Failed to discard the new restaurant.');
          setIsCancelling(false);
        }
      }
    } else {
      // For an existing restaurant, just go back
      router.push('/restaurantsdatabase');
    }
  };

  const handleDelete = async () => {
    if (!restaurantId) {
      setError('Cannot delete, no restaurant ID found.');
      return;
    }

    if (window.confirm('Are you sure you want to permanently delete this restaurant and all its data?')) {
      setIsDeleting(true);
      setError(null);
      try {
        await deleteDoc(doc(db, 'restaurants', restaurantId));
        router.push('/restaurantsdatabase');
      } catch (err) {
        console.error('Error deleting restaurant:', err);
        setError('Failed to delete restaurant. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  const handleJsonBlur = () => {
    if (!jsonInput.trim()) {
      setJsonError(null)
      setJsonSuccess(null)
      return
    }

    try {
      const parsedJson = JSON.parse(jsonInput) as MenuJson
      
      // Validate the structure
      if (!parsedJson.menuCategories || !Array.isArray(parsedJson.menuCategories)) {
        setJsonError('Invalid JSON structure: menuCategories must be an array')
        setJsonSuccess(null)
        return
      }

      // Validate each category
      for (const category of parsedJson.menuCategories) {
        if (!category.id || !category.name || !Array.isArray(category.items)) {
          setJsonError('Invalid category structure: each category must have id, name, and items array')
          setJsonSuccess(null)
          return
        }

        // Validate each item
        for (const item of category.items) {
          if (!item.id || !item.name || typeof item.price !== 'number' || !Array.isArray(item.dietaryRestrictions)) {
            setJsonError('Invalid item structure: each item must have id, name, price, and dietaryRestrictions array')
            setJsonSuccess(null)
            return
          }
        }
      }

      // Count total items
      const totalItems = parsedJson.menuCategories.reduce((sum, category) => 
        sum + (category.items?.length || 0), 0
      )

      // Create success message
      const successMessage = `Found ${parsedJson.menuCategories.length} categories with ${totalItems} items`
      setJsonSuccess(successMessage)
      setJsonError(null)

      // Update form data
      setFormData(prev => ({
        ...prev!,
        menuCategories: parsedJson.menuCategories
      }))
    } catch (error) {
      setJsonError('Invalid JSON format')
      setJsonSuccess(null)
    }
  }

  const renderDetailRow = (
    label: string, 
    value: string, 
    fieldName: keyof Omit<RestaurantFormData, 'menuCategories'>,
    IconComponent: LucideIcon,
    required?: boolean
  ) => {
    return (
      <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
            <div className="flex flex-col w-full">
              <Input
                name={fieldName}
                value={value}
                onChange={handleFormChange}
                onBlur={required ? ((e) => handleBlur(fieldName, e.target.value)) : undefined}
                className="w-full text-sm"
                icon={IconComponent}
                placeholder={required ? `${label} *` : label}
                error={required ? formErrors[fieldName] : false}
              />
            </div>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>
    )
  }
  
  if (loading) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} className="flex justify-center items-center">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading Editor...</span>
            </div>
        </div>
      )
  }

  if (error) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} className="flex justify-center items-center">
             <p className="text-red-500">{error}</p>
        </div>
    )
  }

  if (!formData) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} className="flex justify-center items-center">
             <p className="text-red-500">No restaurant data found to edit.</p>
        </div>
    )
  }
  
  const isSaveDisabled = 
    !formData?.name || 
    !formData?.address || 
    !formData.menuCategories[0]?.name ||
    !formData.menuCategories[0]?.items[0]?.name;

  const allContent = [
    renderDetailRow('Name', formData.name, 'name', Store, true),
    <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
            <div className="flex flex-col w-full">
              <Input
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                onBlur={(e) => {
                  handleAddressBlur();
                  handleBlur(e.target.name, e.target.value);
                }}
                className="w-full text-sm"
                icon={isPending ? Loader2 : MapPin}
                iconClassName={isPending ? 'animate-spin' : ''}
                placeholder="Address *"
                error={!!addressError || formErrors.address}
                warning={!!addressWarning}
                disabled={isPending}
              />
              {addressError && (
                <p className="text-red-500 text-xs mt-1 px-3">{addressError}</p>
              )}
              {formErrors.address && !addressError && (
                <p className="text-red-500 text-xs mt-1 px-3">Address is required.</p>
              )}
              {addressWarning && !addressError && !formErrors.address && (
                <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1 px-3">{addressWarning}</p>
              )}
            </div>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>,
    renderDetailRow('Website', formData.website, 'website', Globe),
    renderDetailRow('Notes', formData.notes, 'notes', NotepadText),
    <div key="spacer-above-tabs" className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
    </div>,
    <div key="tabs-row" className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
            <Tabs<TabType>
              tabs={[
                { id: 'manual', label: 'Manual' },
                { id: 'json', label: 'JSON' }
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              className="w-full"
            />
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
    </div>,
    <div key="spacer-below-tabs" className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
    </div>,
    activeTab === 'json' ? (
      <div key="json-input-row" className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
            <TextArea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              onBlur={handleJsonBlur}
              error={!!jsonError}
              errorMessage={jsonError || undefined}
              warning={jsonSuccess}
              placeholder="Paste your menu JSON here..."
              rows={20}
            />
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>
    ) : null,
    ...(activeTab === 'manual' ? (formData.menuCategories || []).flatMap((category, categoryIndex) => [
      // Category Header
      <div 
        key={category.id}
        ref={el => { if (el) categoryRefs.current[categoryIndex] = el; }}
        className="flex justify-center" 
        style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}
      >
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, justifyContent: 'space-between' }}>
            <div className="flex-1 flex items-center">
                <Input 
                  placeholder={categoryIndex === 0 ? "Category Name *" : "Category Name"}
                  value={category.name} 
                  onFocus={() => setActiveCategoryIndex(categoryIndex)}
                  onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)} 
                  onBlur={categoryIndex === 0 ? () => handleBlur('name', category.name, category.id) : undefined}
                  error={categoryIndex === 0 && formErrors[category.id]?.name}
                  className="w-full text-base font-semibold" 
                />
                <Button variant="secondary" onClick={() => addItemToCategory(categoryIndex)} aria-label="Add item to category">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="secondary" onClick={() => deleteCategory(categoryIndex)} aria-label="Delete category">
                  <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>,
      // Menu Items
      ...category.items.map((item, itemIndex) => (
        <div 
          key={item.id || `item-${categoryIndex}-${itemIndex}`} 
          ref={el => { if (el) itemRefs.current[`${categoryIndex}-${itemIndex}`] = el; }}
          className="flex justify-center" 
          style={{ borderBottom: '1px solid var(--border-main)' }}
        >
            <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <div className="flex-1 flex items-start">
                  <div className="flex-1 flex flex-col">
                    <Input 
                        placeholder={categoryIndex === 0 && itemIndex === 0 ? "Item Name *" : "Item Name"}
                        value={item.name} 
                        onFocus={() => setActiveCategoryIndex(categoryIndex)} 
                        onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'name', e.target.value)} 
                        onBlur={categoryIndex === 0 && itemIndex === 0 ? () => handleBlur('name', item.name, category.id, item.id) : undefined}
                        error={categoryIndex === 0 && itemIndex === 0 && formErrors[category.id]?.items?.[item.id]?.name}
                        className="w-full text-sm" 
                    />
                    <Input placeholder="Description" value={item.description || ''} onFocus={() => setActiveCategoryIndex(categoryIndex)} onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'description', e.target.value)} className="w-full text-sm" />
                    <Input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="Price" 
                      value={item.price || ''} 
                      onFocus={() => setActiveCategoryIndex(categoryIndex)} 
                      onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'price', e.target.value)}
                      className="w-full text-sm" 
                    />
                  </div>
                  <Button variant="secondary" onClick={() => deleteItem(categoryIndex, itemIndex)} aria-label={`Delete item ${item.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
            </div>
            <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
      )),
      // Visual spacer after each category block
      <div key={`spacer-${categoryIndex}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </div>
    ]) : [])
  ].filter(Boolean);

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
          <Button variant="secondary" onClick={handleCancel} aria-label="Cancel edit" disabled={isCancelling || isDeleting}>
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </Button>
          <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Edit Details</h1>
          <div className="flex items-center">
            <Button variant="secondary" onClick={handleDelete} disabled={isDeleting} aria-label="Delete restaurant">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={isSaving || isDeleting || isSaveDisabled} 
              aria-label="Save changes"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>

      <main className="space-y-0" style={{ height: `calc(100vh - 48px - env(safe-area-inset-top))`, overflowY: 'auto', paddingBottom: 'calc(48px + env(safe-area-inset-bottom))' }} role="region" aria-label="Restaurant editor">
          <>
            {[...Array(rowCount)].map((_, i) => {
              const content = allContent[i];
              if (content) {
                return React.cloneElement(content, { key: `content-${i}` });
              }
              return (
                <div key={`empty-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
                  <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
                  <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
                </div>
              );
            })}
          </>
      </main>

      {/* Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-10" style={{ borderTop: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
          <div className="flex justify-center">
              <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', height: 48 }}>
                {activeTab === 'manual' ? (
                  <>
                    <div className="flex-1">
                      <Button variant="secondary" onClick={addCategory} className="w-full" aria-label="Add a new category to the menu">
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-main)'}}>
                      <Button variant="secondary" onClick={() => { if (activeCategoryIndex !== null) addItemToCategory(activeCategoryIndex)}} disabled={activeCategoryIndex === null} aria-label="Add a new item to the active category">
                        <ListPlus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1">
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        const jsonFormat = {
                          menuCategories: [
                            {
                              id: "category-id",
                              name: "Category Name",
                              items: [
                                {
                                  id: "item-id",
                                  name: "Item Name",
                                  description: "Item Description",
                                  price: 0,
                                  dietaryRestrictions: []
                                }
                              ]
                            }
                          ]
                        }
                        navigator.clipboard.writeText(JSON.stringify(jsonFormat, null, 2))
                      }} 
                      className="w-full" 
                      aria-label="Copy JSON format"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON Format
                    </Button>
                  </div>
                )}
              </div>
              <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
          </div>
          <div className="flex justify-center" style={{ height: 'env(safe-area-inset-bottom)', background: 'var(--background-main)' }}>
            <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            <div style={{ flex: 1, maxWidth: 800 }} />
            <div style={{ width: 32 }} />
          </div>
      </footer>
    </div>
  )
} 