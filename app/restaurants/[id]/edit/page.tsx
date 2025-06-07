'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, GeoPoint, updateDoc, deleteDoc } from 'firebase/firestore'
import { useViewMode } from '../../../contexts/ViewModeContext'
import { Button } from '../../../design-system/components/Button'
import { ArrowLeft, Loader2, Check, X, Plus, Trash2, Store, MapPin, Globe, NotepadText, FolderPlus, ListPlus } from 'lucide-react'
import { Input } from '../../../design-system/components/Input'
import { v4 as uuidv4 } from 'uuid';

// Interfaces matching the Firestore structure
interface MenuItemFirestore {
  id: string;
  name: string;
  description?: string;
  price: number | null; // Allow null for empty price
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

export default function RestaurantEditPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<RestaurantFormData | null>(null);
  const [originalAddress, setOriginalAddress] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For general form errors
  const [addressError, setAddressError] = useState<string | null>(null); // For address-specific validation
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  const [validatedAddressInfo, setValidatedAddressInfo] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [isNewRestaurant, setIsNewRestaurant] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const hasSaved = useRef(false);
  
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
      setLoading(true);
      setError(null);
      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId);
        const docSnap = await getDoc(restaurantRef);

        if (docSnap.exists()) {
          const restaurantData = docSnap.data();
          // Check if the restaurant is "new" (i.e., has no name yet)
          if (!restaurantData.name) {
            setIsNewRestaurant(true);
          }
          // Initialize form data
          setFormData({
              name: restaurantData.name || '',
              address: restaurantData.address || '',
              website: restaurantData.website || '',
              notes: restaurantData.notes || '',
              // Ensure price is null if it's 0 or not present
              menuCategories: (restaurantData.menuCategories || []).map((cat: MenuCategoryFirestore) => ({
                ...cat,
                items: cat.items.map((item: any) => ({
                  ...item,
                  price: item.price === 0 ? null : item.price,
                })),
              })),
          });
          setOriginalAddress(restaurantData.address || '');
        } else {
          setError('Restaurant not found.');
        }
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setError('Failed to load restaurant details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantId]);

  // Effects for scrolling to new elements
  useEffect(() => {
    if (newlyAddedCategoryIndex !== null && categoryRefs.current[newlyAddedCategoryIndex]) {
      const newCategoryElement = categoryRefs.current[newlyAddedCategoryIndex];
      newCategoryElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = newCategoryElement?.querySelector('input');
      if (input) setTimeout(() => input.focus(), 300);
      setNewlyAddedCategoryIndex(null);
    }
  }, [newlyAddedCategoryIndex]);

  useEffect(() => {
    if (newlyAddedItem !== null) {
      const itemKey = `${newlyAddedItem.catIndex}-${newlyAddedItem.itemIndex}`;
      const newItemElement = itemRefs.current[itemKey];
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = newItemElement.querySelector('input');
        if (input) setTimeout(() => input.focus(), 300);
        setNewlyAddedItem(null);
      }
    }
  }, [newlyAddedItem]);

  const validateField = (name: string, value: any) => !String(value || '').trim();

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
      if (name === 'name' || name === 'address') {
        handleBlur(name, value);
      }
      setIsDirty(true);
  }

  const handleMenuChange = (categoryIndex: number, itemIndex: number, field: keyof MenuItemFirestore, value: string | number) => {
      if (!formData) return;
      setIsDirty(true);
      const newMenuCategories = [...formData.menuCategories];
      const item = newMenuCategories[categoryIndex].items[itemIndex];

      if (field === 'price') {
        const priceValue = value.toString();
        if (priceValue === '' || /^\d*\.?\d{0,2}$/.test(priceValue.replace(',', '.'))) {
          const sanitizedValue = priceValue.replace(',', '.');
          const newPrice = parseFloat(sanitizedValue);
          item.price = isNaN(newPrice) ? null : newPrice;
          (item as any).displayPrice = sanitizedValue;
        }
      } else {
        (item as any)[field] = value;
      }
      setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
  }

  const handleCategoryNameChange = (categoryIndex: number, value: string) => {
    if (!formData) return;
    setIsDirty(true);
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].name = value;
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
  }

  const addCategory = () => {
    if (!formData) return;
    setIsDirty(true);
    const newCategory: MenuCategoryFirestore = {
      id: uuidv4(), name: '', items: [{ id: uuidv4(), name: '', description: '', price: null, dietaryRestrictions: [] }]
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
    setIsDirty(true);
    const newItem: MenuItemFirestore = { id: uuidv4(), name: '', description: '', price: null, dietaryRestrictions: [] };
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.push(newItem);
    const newItemIndex = newMenuCategories[categoryIndex].items.length - 1;
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
    setNewlyAddedItem({ catIndex: categoryIndex, itemIndex: newItemIndex });
  }

  const deleteCategory = (categoryIndex: number) => {
    if (!formData) return;
    setIsDirty(true);
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories.splice(categoryIndex, 1);
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
    if (activeCategoryIndex !== null && activeCategoryIndex >= categoryIndex) {
      setActiveCategoryIndex(activeCategoryIndex > 0 ? activeCategoryIndex - 1 : 0);
    }
  }

  const deleteItem = (categoryIndex: number, itemIndex: number) => {
    if (!formData) return;
    setIsDirty(true);
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.splice(itemIndex, 1);
    setFormData(prev => ({ ...prev!, menuCategories: newMenuCategories }));
  }

  const handleAddressBlur = () => {
    if (!formData || formData.address === originalAddress) {
      setAddressError(null);
      setAddressWarning(null);
      return;
    }
    startTransition(async () => {
      setAddressError(null);
      setAddressWarning(null);
      setValidatedAddressInfo(null);
      if (formData.address.trim()) {
        try {
          const res = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
          if (!res.ok) throw new Error('Geocoding failed');
          const data = await res.json();
          if (data.quality === 'approximate') {
            setAddressWarning(`Address is approximate. Using: ${data.formatted_address}`);
            setValidatedAddressInfo({ latitude: data.latitude, longitude: data.longitude });
          } else if (data.quality === 'good') {
            setAddressWarning(null);
            setValidatedAddressInfo({ latitude: data.latitude, longitude: data.longitude });
          }
        } catch (e) {
          setAddressError('Could not validate address. Please check it and try again.');
        }
      }
    });
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    setError(null);

    const errors: any = {};
    if (!formData.name.trim()) errors.name = true;
    if (!formData.address.trim()) errors.address = true;
    if (formData.menuCategories.length > 0) {
      if (!formData.menuCategories[0].name.trim()) {
        if (!errors.menuCategories) errors.menuCategories = {};
        errors.menuCategories[formData.menuCategories[0].id] = { name: true };
      }
      if (formData.menuCategories[0].items.length > 0) {
        if (!formData.menuCategories[0].items[0].name.trim()) {
          if (!errors.menuCategories) errors.menuCategories = {};
          if (!errors.menuCategories[formData.menuCategories[0].id]) errors.menuCategories[formData.menuCategories[0].id] = {};
          errors.menuCategories[formData.menuCategories[0].id].items = { [formData.menuCategories[0].items[0].id]: { name: true } };
        }
      }
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fill in all required fields marked with *");
      setIsSaving(false);
      return;
    }
    if (addressError) {
      setError("Please fix the address validation error before saving.");
      setIsSaving(false);
      return;
    }

    try {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const dataToUpdate = {
        name: formData.name,
        address: formData.address,
        website: formData.website,
        notes: formData.notes,
        menuCategories: formData.menuCategories.map(category => ({
          ...category,
          items: category.items.map(item => ({
            ...item,
            price: item.price ?? 0 // Ensure price is a number for Firestore
          }))
        })),
        ...(validatedAddressInfo && { gps: new GeoPoint(validatedAddressInfo.latitude, validatedAddressInfo.longitude) })
      };
      await updateDoc(restaurantRef, dataToUpdate);
      hasSaved.current = true;
      router.push(`/restaurants/${restaurantId}`);
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setError('Failed to save restaurant details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }
  
  const handleBack = () => {
    if (isDirty && !hasSaved.current) {
      const confirmed = window.confirm('You have unsaved changes that will be lost. Are you sure you want to go back?');
      if (!confirmed) return;
    }
    if (isNewRestaurant && !hasSaved.current) {
      handleDelete(true);
    } else {
      router.back();
    }
  };

  const handleDelete = async (isNavigatingAway = false) => {
    if (!isNavigatingAway && !window.confirm("Are you sure you want to delete this restaurant? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      await deleteDoc(restaurantRef);
      if (isNavigatingAway) {
        router.back();
      } else {
        router.push('/restaurantsdatabase');
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("Failed to delete restaurant. Please try again.");
      setIsDeleting(false);
    }
  };

  const isSaveDisabled = 
    !formData ||
    isSaving || 
    addressError !== null || 
    !formData.name.trim() || 
    !formData.address.trim() || 
    (formData.menuCategories.length > 0 && 
      (!formData.menuCategories[0].name.trim() || 
       (formData.menuCategories[0].items.length > 0 && !formData.menuCategories[0].items[0].name.trim())
      )
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '100vh', background: 'var(--background-main)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-primary)' }}/>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="flex flex-col justify-center items-center" style={{ height: '100vh', background: 'var(--background-main)', color: 'var(--text-primary)' }}>
        <p>{error}</p>
        <Button onClick={() => router.push('/restaurantsdatabase')} className="mt-4">Back to List</Button>
      </div>
    )
  }

  if (!formData) {
    return null; // Should be handled by loading and error states
  }

  return (
    <div style={{ background: 'var(--background-main)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 8px', justifyContent: 'space-between' }}>
          <Button variant="secondary" onClick={handleBack} aria-label="Go back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Edit Details</h1>
          <div className="flex items-center">
            <Button variant="secondary" onClick={() => handleDelete()} disabled={isDeleting} aria-label="Delete restaurant">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={isSaveDisabled || isSaving}
              aria-label="Save changes"
              style={{ marginLeft: '8px' }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>
      
      {/* Main Content */}
      <main>
        {/* Restaurant Details */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, padding: '16px 0' }}>
            <div className="px-4">
              <Input
                  name="name"
                  placeholder="Restaurant Name *"
                  value={formData.name}
                  onChange={handleFormChange}
                  onBlur={(e) => handleBlur('name', e.target.value)}
                  error={formErrors.name}
                  Icon={Store}
              />
              <Input
                  name="address"
                  placeholder="Address *"
                  value={formData.address}
                  onChange={handleFormChange}
                  onBlur={handleAddressBlur}
                  error={!!addressError || formErrors.address}
                  warning={addressWarning}
                  Icon={MapPin}
                  icon={isPending ? () => <Loader2 className="w-4 h-4 animate-spin"/> : MapPin}
              />
              <Input name="website" placeholder="Website" value={formData.website} onChange={handleFormChange} Icon={Globe} />
              <Input name="notes" placeholder="Notes" value={formData.notes} onChange={handleFormChange} Icon={NotepadText} />
            </div>
          </div>
          <div style={{ width: 32, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
        
        {/* Error Display */}
        {error && <div className="text-red-500 text-center py-2">{error}</div>}

        {/* Menu Categories and Items */}
        {formData.menuCategories.map((category, categoryIndex) => (
          <div key={category.id}>
            {/* Category Header */}
            <div
              ref={el => { categoryRefs.current[categoryIndex] = el }}
              className="flex justify-center" 
              style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}
            >
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 8px', justifyContent: 'space-between' }}>
                  <div className="flex-1 flex items-center">
                      <Input 
                        placeholder={categoryIndex === 0 ? "Category Name *" : "Category Name"}
                        value={category.name} 
                        onFocus={() => setActiveCategoryIndex(categoryIndex)}
                        onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)} 
                        onBlur={categoryIndex === 0 ? () => handleBlur('name', category.name, category.id) : undefined}
                        error={categoryIndex === 0 && formErrors.menuCategories?.[category.id]?.name}
                        className="w-full text-base font-semibold" 
                      />
                      <Button variant="secondary" onClick={() => deleteCategory(categoryIndex)} aria-label="Delete category">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>

            {/* Menu Items */}
            {category.items.map((item, itemIndex) => (
              <div 
                key={item.id} 
                ref={el => itemRefs.current[`${categoryIndex}-${itemIndex}`] = el}
                className="flex justify-center" 
                style={{ borderBottom: '1px solid var(--border-main)' }}
              >
                  <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
                  <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0' }}>
                      <div className="flex-1 flex items-start p-0">
                        <div className="flex-1 flex flex-col">
                          <Input 
                              placeholder={categoryIndex === 0 && itemIndex === 0 ? "Item Name *" : "Item Name"}
                              value={item.name} 
                              onFocus={() => setActiveCategoryIndex(categoryIndex)} 
                              onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'name', e.target.value)} 
                              onBlur={categoryIndex === 0 && itemIndex === 0 ? () => handleBlur('name', item.name, category.id, item.id) : undefined}
                              error={categoryIndex === 0 && itemIndex === 0 && formErrors.menuCategories?.[category.id]?.items?.[item.id]?.name}
                              className="w-full text-sm" 
                          />
                          <Input placeholder="Description" value={item.description || ''} onFocus={() => setActiveCategoryIndex(categoryIndex)} onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'description', e.target.value)} className="w-full text-sm" />
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            placeholder="Price" 
                            value={(item as any).displayPrice ?? item.price ?? ''} 
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
            ))}
          </div>
        ))}
      </main>
      
      {/* Bottom Action Bar */}
      <footer className="sticky bottom-0 z-30 flex justify-center" style={{ borderTop: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', height: 48, padding: '0 8px', gap: '8px' }}>
          <Button variant="outline" onClick={addCategory} className="flex-1">
            <FolderPlus className="w-4 h-4 mr-2" /> Add Category
          </Button>
          <Button variant="outline" onClick={() => activeCategoryIndex !== null && addItemToCategory(activeCategoryIndex)} disabled={activeCategoryIndex === null} className="flex-shrink-0">
            <ListPlus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </footer>
    </div>
  )
} 
