'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, GeoPoint, updateDoc, deleteDoc } from 'firebase/firestore'
import { useViewMode } from '../../../contexts/ViewModeContext'
import { Button } from '../../../design-system/components/Button'
import { ArrowLeft, Edit, Loader2, Check, X, Plus, Trash2, Store, MapPin, Globe, NotepadText, FolderPlus, ListPlus, Undo2, LucideProps } from 'lucide-react'
import { ListItem } from '../../../design-system/components/ListItem'
import { Input } from '../../../design-system/components/Input'
import { v4 as uuidv4 } from 'uuid';
import { useRef } from 'react';

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
    if (activeCategoryIndex === categoryIndex || activeCategoryIndex! >= newMenuCategories.length) {
      setActiveCategoryIndex(newMenuCategories.length > 0 ? newMenuCategories.length - 1 : null);
    }
  }

  const deleteItem = (categoryIndex: number, itemIndex: number) => {
    if (!formData) return;
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
      try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
        const data = await response.json();
  
        if (response.ok) {
          if (data.quality === 'good') {
            setAddressError(null);
            setAddressWarning(null);
          } else {
            setAddressError(null);
            setAddressWarning('This address might be inaccurate. Please review it.');
          }
        } else {
          setAddressWarning(null);
          setAddressError(data.error || 'Failed to validate address.');
        }
      } catch (error) {
        console.error('Geocoding fetch error:', error);
        setAddressWarning(null);
        setAddressError('An error occurred while validating the address.');
      }
    });
  };
  
  const handleSave = async () => {
    if (!formData) {
      setError("Form data is not loaded yet.");
      return;
    }

    const errors: any = {};
    if (!formData.name.trim()) errors.name = true;
    if (!formData.address.trim()) errors.address = true;
    if (formData.menuCategories.length > 0) {
      const firstCategory = formData.menuCategories[0];
      if (!firstCategory.name.trim()) {
        if (!errors[firstCategory.id]) errors[firstCategory.id] = {};
        errors[firstCategory.id].name = true;
      }
      if (firstCategory.items.length > 0) {
        const firstItem = firstCategory.items[0];
        if (!firstItem.name.trim()) {
          if (!errors[firstCategory.id]) errors[firstCategory.id] = { items: {} };
          if (!errors[firstCategory.id].items) errors[firstCategory.id].items = {};
          if (!errors[firstCategory.id].items[firstItem.id]) errors[firstCategory.id].items[firstItem.id] = {};
          errors[firstCategory.id].items[firstItem.id].name = true;
        }
      }
    }
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
        // If there are top-level errors or nested errors, prevent saving.
        if (Object.values(errors).some(val => val === true || (typeof val === 'object' && Object.keys(val).length > 0))) {
            setError("Please fill in all required fields marked with *");
            return;
        }
    }

    if (addressError) {
        setError("Please fix the address validation error before saving.");
        return;
    }

    setIsSaving(true);
    setError(null);
    try {
        let finalGps = undefined;
        // If the address has changed, re-geocode to get updated coordinates.
        if (formData.address !== originalAddress) {
            const response = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
            const data = await response.json();
            if (response.ok && data.quality === 'good') {
                finalGps = new GeoPoint(data.lat, data.lng);
            } else {
                // If geocoding fails on save, use original GPS or none, but maybe warn user.
                console.warn("Could not verify new address, GPS data may be stale.");
            }
        }

        const restaurantRef = doc(db, "restaurants", restaurantId);
        const dataToUpdate: any = {
            name: formData.name,
            address: formData.address,
            website: formData.website,
            notes: formData.notes,
            menuCategories: formData.menuCategories,
        };

        if (finalGps) {
            dataToUpdate.gps = finalGps;
        }

        await updateDoc(restaurantRef, dataToUpdate);
        
        router.push(`/restaurants/${restaurantId}`);

    } catch (err) {
        console.error("Error updating document: ", err);
        setError("Failed to save changes. Please try again.");
        setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (isNewRestaurant) {
      setIsCancelling(true);
      await handleDelete(true); // Pass flag to indicate this is a cancel-delete
      router.push('/restaurantsdatabase');
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
      if (!isNavigatingAway) {
        router.push('/restaurantsdatabase');
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("Failed to delete restaurant. Please try again.");
      setIsDeleting(false); // Only reset if deletion fails and we're not navigating
    }
  };

  const renderDetailRow = (
    label: string, 
    value: string, 
    fieldName: keyof Omit<RestaurantFormData, 'menuCategories'>,
    IconComponent: React.ForwardRefExoticComponent<LucideProps>,
    required?: boolean
  ) => {
    // Determine if there is an error for this specific field.
    const hasError = required ? formErrors[fieldName] : false;

    return (
      <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '8px 0' }}>
            <div className="flex flex-col w-full gap-1 px-3">
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

  const isSaveDisabled = 
    isSaving || 
    addressError !== null || 
    (formData && (!formData.name.trim() || !formData.address.trim() || formData.menuCategories.length === 0 || !formData.menuCategories[0].name.trim() || formData.menuCategories[0].items.length === 0 || !formData.menuCategories[0].items[0].name.trim()));

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '100vh', background: 'var(--background-main)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error && !formData) {
    return <p className="text-red-500 p-4">{error}</p>;
  }

  if (!formData) {
    return <p>No restaurant data available.</p>;
  }

  const allContent = [
    renderDetailRow('Restaurant Name', formData.name, 'name', Store, true),
    <div key="address-row" className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '8px 0' }}>
            <div className="flex flex-col w-full gap-1 px-3">
                <Input
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    onBlur={handleAddressBlur}
                    className="w-full text-sm"
                    icon={MapPin}
                    placeholder="Address *"
                    error={formErrors.address || !!addressError}
                    warning={!!addressWarning}
                />
                {isPending && <Loader2 className="w-4 h-4 animate-spin self-center mt-1" />}
                {addressError && !isPending && <span className="text-xs text-red-500 mt-1">{addressError}</span>}
                {addressWarning && !isPending && <span className="text-xs text-yellow-500 mt-1">{addressWarning}</span>}
            </div>
        </div>
        <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
    </div>,
    renderDetailRow('Website', formData.website, 'website', Globe),
    renderDetailRow('Notes', formData.notes, 'notes', NotepadText),
     ...formData.menuCategories.flatMap((category, categoryIndex) => [
       // Category Header
       <div 
        key={category.id}
        ref={(el) => { categoryRefs.current[categoryIndex] = el }}
        className="flex justify-center" 
        style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-alt)' }}
       >
        <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 8px', justifyContent: 'space-between' }}>
            <div className="flex-1 flex items-center">
                <Input 
                  value={category.name} 
                  onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)}
                  onFocus={() => setActiveCategoryIndex(categoryIndex)}
                  onBlur={(e) => handleBlur('name', e.target.value, category.id)}
                  className="font-semibold text-base flex-1" 
                  placeholder={categoryIndex === 0 ? "Category Name *" : "Category Name"}
                  error={formErrors[category.id]?.name}
                />
            </div>
            <div className="flex items-center">
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
          key={item.id} 
          ref={(el) => { itemRefs.current[`${categoryIndex}-${itemIndex}`] = el }}
          className="flex justify-center" 
          style={{ borderBottom: '1px solid var(--border-main)' }}
          onFocus={() => setActiveCategoryIndex(categoryIndex)}
        >
             <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
             <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '8px 16px' }}>
                 <div className="flex-1 flex items-start gap-2">
                   <div className="flex-1 flex flex-col gap-2 py-2">
                     <Input 
                        placeholder={categoryIndex === 0 && itemIndex === 0 ? "Item Name *" : "Item Name"}
                        value={item.name} 
                        onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'name', e.target.value)} 
                        onBlur={(e) => handleBlur('name', e.target.value, category.id, item.id)}
                        error={formErrors[category.id]?.items?.[item.id]?.name}
                     />
                     <Input 
                        placeholder="Description" 
                        value={item.description || ''} 
                        onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'description', e.target.value)} 
                     />
                     <Input 
                        type="text" 
                        placeholder="Price" 
                        value={item.price} 
                        onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'price', e.target.value)} 
                     />
                   </div>
                   <Button variant="secondary" onClick={() => deleteItem(categoryIndex, itemIndex)} aria-label="Delete item">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
             </div>
             <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
         </div>
       )),
       <div key={`spacer-${categoryIndex}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
         <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
         <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
         <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
       </div>
     ])
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
             {[...Array(rowCount)].map((_, i) => allContent[i] || (
               <div key={`empty-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                   <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
                   <div style={{ flex: 1, maxWidth: 800, minHeight: 48 }} />
                   <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
               </div>
             ))}
           </>
       </main>

       {/* Bottom Bar */}
       <footer className="fixed bottom-0 left-0 right-0 z-10" style={{ borderTop: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
           <div className="flex justify-center">
               <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
               <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', height: 48 }}>
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
