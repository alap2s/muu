'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, GeoPoint, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore'
import { useViewMode } from '../../../contexts/ViewModeContext'
import { Button } from '../../../design-system/components/Button'
import { ArrowLeft, Edit, Loader2, Check, X, Plus, Trash2, Store, MapPin, Globe, NotepadText, FolderPlus, ListPlus, Undo2, LucideIcon, Copy, Filter, CookingPot, Milk, Leaf, Nut, Wheat, WheatOff, Flame, Droplet, Egg, Fish, Shell, Ban, Wine, Candy, Drumstick, Salad } from 'lucide-react'
import { ListItem } from '../../../design-system/components/ListItem'
import { Input } from '../../../design-system/components/Input'
import { v4 as uuidv4 } from 'uuid';
import { useRef } from 'react';
import { Tabs } from '../../../design-system/components/Tabs'
import { TextArea } from '../../../design-system/components/TextArea'
import { MultiSelectDropdown } from '../../../design-system/components/MultiSelectDropdown'
import React from 'react';
import ReactDOM from 'react-dom';

const DIETARY_OPTIONS = [
  // Lifestyles
  { value: 'vegetarian', label: 'Vegetarian', icon: Leaf },
  { value: 'vegan', label: 'Vegan', icon: Leaf },
  { value: 'pescatarian', label: 'Pescatarian', icon: Fish },

  // Meat Types (all use Drumstick icon)
  { value: 'pork', label: 'Pork', icon: Drumstick },
  { value: 'beef', label: 'Beef', icon: Drumstick },
  { value: 'lamb', label: 'Lamb', icon: Drumstick },
  { value: 'chicken', label: 'Chicken', icon: Drumstick },
  { value: 'duck', label: 'Duck', icon: Drumstick },
  { value: 'turkey', label: 'Turkey', icon: Drumstick },
  { value: 'fish', label: 'Fish', icon: Fish },
  { value: 'shellfish', label: 'Shellfish', icon: Shell },
  { value: 'crustacean', label: 'Crustacean', icon: Shell },
  { value: 'mollusc', label: 'Mollusc', icon: Shell },
  { value: 'game', label: 'Game', icon: Drumstick },

  // EU 14 Allergens
  { value: 'gluten', label: 'Gluten (Wheat, Rye, Barley, Oats, Spelt)', icon: Wheat },
  { value: 'crustaceans', label: 'Crustaceans', icon: Shell },
  { value: 'eggs', label: 'Eggs', icon: Egg },
  { value: 'fish-allergen', label: 'Fish (Allergen)', icon: Fish },
  { value: 'peanuts', label: 'Peanuts', icon: Nut },
  { value: 'soybeans', label: 'Soybeans', icon: Droplet },
  { value: 'milk', label: 'Milk', icon: Milk },
  { value: 'nuts', label: 'Nuts', icon: Nut },
  { value: 'celery', label: 'Celery', icon: CookingPot },
  { value: 'mustard', label: 'Mustard', icon: CookingPot },
  { value: 'sesame', label: 'Sesame', icon: CookingPot },
  { value: 'sulphites', label: 'Sulphur Dioxide/Sulphites', icon: Droplet },
  { value: 'lupin', label: 'Lupin', icon: CookingPot },
  { value: 'molluscs', label: 'Molluscs', icon: Shell },

  // Other
  { value: 'lactose-free', label: 'Lactose Free', icon: Ban },
  { value: 'dairy-free', label: 'Dairy Free', icon: Ban },
  { value: 'nut-free', label: 'Nut Free', icon: Ban },
  { value: 'egg-free', label: 'Egg Free', icon: Ban },
  { value: 'soy-free', label: 'Soy Free', icon: Ban },
  { value: 'sesame-free', label: 'Sesame Free', icon: Ban },
  { value: 'peanut-free', label: 'Peanut Free', icon: Ban },
  { value: 'gluten-free', label: 'Gluten Free', icon: WheatOff },
  { value: 'spicy', label: 'Spicy', icon: Flame },
  { value: 'contains-alcohol', label: 'Alcohol', icon: Wine },
  { value: 'contains-sugar', label: 'Sugar', icon: Candy },
  { value: 'low-carb', label: 'Low Carb', icon: Ban },
  { value: 'low-fat', label: 'Low Fat', icon: Ban },
  { value: 'high-protein', label: 'High Protein', icon: Ban },
  // Religious/Cultural
  { value: 'halal', label: 'Halal', icon: Ban },
  { value: 'kosher', label: 'Kosher', icon: Ban },
];

const DIETARY_KEYWORDS: { [key: string]: string[] } = {
  // Lifestyles
  'vegetarian': ['vegetarian', 'veg', 'no meat', 'meatless', 'plant-based', 'plant based'],
  'vegan': ['vegan', 'plant-based', 'plant based', 'no animal products'],
  'pescatarian': ['pescatarian', 'pesco-vegetarian', 'fish only'],

  // Meat Types (keys match DIETARY_OPTIONS)
  'pork': ['pork', 'bacon', 'ham', 'sausage', 'prosciutto', 'pancetta', 'lardon', 'chorizo', 'salami', 'pepperoni'],
  'beef': ['beef', 'steak', 'burger', 'hamburger', 'meatball', 'mince', 'ground beef', 'roast beef'],
  'lamb': ['lamb', 'mutton', 'lamb chop', 'lamb shank'],
  'chicken': ['chicken', 'poultry', 'chicken breast', 'chicken thigh', 'chicken wing'],
  'duck': ['duck', 'duck breast', 'duck leg', 'poultry'],
  'turkey': ['turkey', 'turkey breast', 'turkey leg'],
  'fish': ['fish', 'seafood', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'mackerel', 'sardine', 'anchovy'],
  'shellfish': ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'scallop'],
  'crustacean': ['crustacean', 'crab', 'lobster', 'shrimp', 'prawn'],
  'mollusc': ['mollusc', 'mussel', 'clam', 'oyster', 'scallop', 'octopus', 'squid'],
  'game': ['game', 'venison', 'rabbit', 'boar', 'pheasant', 'quail'],

  // EU 14 Allergens
  'gluten': ['gluten', 'wheat', 'rye', 'barley', 'oats', 'spelt', 'flour', 'bread', 'pasta'],
  'crustaceans': ['crustacean', 'crab', 'lobster', 'shrimp', 'prawn'],
  'eggs': ['egg', 'eggs'],
  'fish-allergen': ['fish', 'seafood', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'mackerel', 'sardine', 'anchovy'],
  'peanuts': ['peanut', 'peanuts'],
  'soybeans': ['soy', 'soybean', 'tofu', 'edamame'],
  'milk': ['milk', 'cheese', 'cream', 'butter', 'yogurt'],
  'nuts': ['nut', 'nuts', 'almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'brazil nut', 'pistachio', 'macadamia'],
  'celery': ['celery'],
  'mustard': ['mustard'],
  'sesame': ['sesame'],
  'sulphites': ['sulphite', 'sulphur dioxide', 'preservative e220', 'preservative e221', 'preservative e222', 'preservative e223', 'preservative e224', 'preservative e226', 'preservative e227', 'preservative e228'],
  'lupin': ['lupin'],
  'molluscs': ['mollusc', 'mussel', 'clam', 'oyster', 'scallop', 'octopus', 'squid'],

  // Other
  'lactose-free': ['lactose-free', 'lactose free', 'no lactose'],
  'dairy-free': ['dairy-free', 'dairy free', 'no dairy'],
  'nut-free': ['nut-free', 'nut free', 'no nuts'],
  'egg-free': ['egg-free', 'egg free', 'no eggs'],
  'soy-free': ['soy-free', 'soy free', 'no soy'],
  'sesame-free': ['sesame-free', 'sesame free', 'no sesame'],
  'peanut-free': ['peanut-free', 'peanut free', 'no peanuts'],
  'gluten-free': ['gluten-free', 'gluten free', 'no gluten', 'gf', 'celiac'],
  'spicy': ['spicy', 'hot', 'chili', 'chilli', 'pepper', 'spice', 'spiced'],
  'contains-alcohol': ['alcohol', 'wine', 'beer', 'cocktail', 'spirit', 'liquor', 'booze'],
  'contains-sugar': ['sugar', 'sweet', 'honey', 'syrup', 'sweetened'],
  'low-carb': ['low-carb', 'low carb', 'keto', 'ketogenic'],
  'low-fat': ['low-fat', 'low fat', 'lean'],
  'high-protein': ['high-protein', 'high protein', 'protein-rich'],
  // Religious/Cultural
  'halal': ['halal', 'islamic', 'muslim'],
  'kosher': ['kosher', 'jewish', 'hechsher']
};

const detectDietaryRestrictions = (text: string): string[] => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const detectedRestrictions = new Set<string>();

  // Helper function to check if a keyword is present without negation
  const hasKeywordWithoutNegation = (keyword: string, negations: string[] = []): boolean => {
    // Check if the keyword exists
    if (!lowerText.includes(keyword)) return false;
    
    // Check for negations around the keyword
    for (const negation of negations) {
      // Look for negation patterns like "no gluten", "gluten free", "without gluten", etc.
      const negationPatterns = [
        new RegExp(`\\b${negation}\\s+${keyword}\\b`, 'i'),
        new RegExp(`\\b${keyword}\\s+${negation}\\b`, 'i'),
        new RegExp(`\\b${negation}-${keyword}\\b`, 'i'),
        new RegExp(`\\b${keyword}-${negation}\\b`, 'i'),
        new RegExp(`\\b${negation}${keyword}\\b`, 'i'),
        new RegExp(`\\b${keyword}${negation}\\b`, 'i')
      ];
      
      if (negationPatterns.some(pattern => pattern.test(lowerText))) {
        return false; // Negation found, don't flag this
      }
    }
    
    return true; // Keyword found without negation
  };

  // Define negation words for different dietary restrictions
  const negations = ['no', 'free', 'without', 'excludes', 'excluded', 'not', 'none', 'zero', 'lacks', 'missing'];
  
  // Check each dietary restriction with context awareness
  Object.entries(DIETARY_KEYWORDS).forEach(([restriction, keywords]) => {
    // Skip "free" restrictions as they're handled separately
    if (restriction.endsWith('-free')) return;
    
    // Check if any keyword is present without negation
    if (keywords.some(keyword => hasKeywordWithoutNegation(keyword, negations))) {
      detectedRestrictions.add(restriction);
    }
  });

  // Handle "free" restrictions separately (they should be detected when explicitly mentioned)
  const freeRestrictions = {
    'lactose-free': ['lactose-free', 'lactose free', 'no lactose'],
    'dairy-free': ['dairy-free', 'dairy free', 'no dairy'],
    'nut-free': ['nut-free', 'nut free', 'no nuts'],
    'egg-free': ['egg-free', 'egg free', 'no eggs'],
    'soy-free': ['soy-free', 'soy free', 'no soy'],
    'sesame-free': ['sesame-free', 'sesame free', 'no sesame'],
    'peanut-free': ['peanut-free', 'peanut free', 'no peanuts'],
    'gluten-free': ['gluten-free', 'gluten free', 'no gluten', 'gf', 'celiac']
  };

  Object.entries(freeRestrictions).forEach(([restriction, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedRestrictions.add(restriction);
    }
  });

  // Remove vegetarian/vegan if any meat type is detected
  const meatTypes = [
    'pork', 'beef', 'lamb', 'chicken', 'duck', 'turkey', 'fish', 'shellfish', 'crustacean', 'mollusc', 'game'
  ];
  if (meatTypes.some(type => detectedRestrictions.has(type))) {
    detectedRestrictions.delete('vegetarian');
    detectedRestrictions.delete('vegan');
    detectedRestrictions.delete('pescatarian');
  }
  
  // Remove vegan if any animal product is detected
  const animalProducts = [
    'eggs', 'milk', 'fish-allergen', 'crustaceans', 'molluscs'
  ];
  if (animalProducts.some(type => detectedRestrictions.has(type))) {
    detectedRestrictions.delete('vegan');
  }

  // Auto-detect vegetarian and vegan based on ingredients
  const hasMeat = meatTypes.some(type => detectedRestrictions.has(type));
  const hasAnimalProducts = animalProducts.some(type => detectedRestrictions.has(type));
  
  // If no meat is detected, it could be vegetarian
  if (!hasMeat) {
    // If no animal products at all, it's vegan
    if (!hasAnimalProducts) {
      detectedRestrictions.add('vegan');
    } else {
      // If has animal products (milk, eggs) but no meat, it's vegetarian
      detectedRestrictions.add('vegetarian');
    }
  }

  // Remove conflicting restrictions
  // If gluten-free is detected, remove gluten
  if (detectedRestrictions.has('gluten-free')) {
    detectedRestrictions.delete('gluten');
  }
  
  // If lactose-free is detected, remove milk
  if (detectedRestrictions.has('lactose-free')) {
    detectedRestrictions.delete('milk');
  }
  
  // If dairy-free is detected, remove milk
  if (detectedRestrictions.has('dairy-free')) {
    detectedRestrictions.delete('milk');
  }

  return Array.from(detectedRestrictions);
};

function DietaryDropdown({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formattedOptions = DIETARY_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
    leftContent: <option.icon className="w-4 h-4" />
  }));

  return (
    <div ref={dropdownRef} className="relative">
      <MultiSelectDropdown
        value={value}
        onChange={onChange}
        options={formattedOptions}
        placeholder="Select dietary restrictions"
        leftIcon={<CookingPot className="w-4 h-4" />}
        className="w-12"
      />
    </div>
  );
}

// Interfaces matching the Firestore structure
interface MenuItemFirestore {
  id: string;
  name: string;
  description?: string;
  price: number;
  dietaryRestrictions: string[];
  dietaryRestrictionsExplicitlySet?: boolean;
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
    coordinates: {
        lat: number;
        lng: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
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
  menuCategories: MenuCategoryFirestore[];
  notes: string;
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
        if (restaurantId === 'new') {
          // Initialize form data for new restaurant
          setFormData({
              name: '',
              address: '',
              website: '',
              notes: '',
              menuCategories: [{
                id: uuidv4(),
                name: '',
                items: [{
                  id: uuidv4(),
                  name: '',
                  description: '',
                  price: 0,
                  dietaryRestrictions: [],
                  dietaryRestrictionsExplicitlySet: false
                }]
              }],
              coordinates: { lat: 0, lng: 0 },
              createdAt: new Date(),
              updatedAt: new Date(),
          });
          setOriginalAddress('');
          setIsNewRestaurant(true);
        } else {
          const restaurantRef = doc(db, 'restaurants', restaurantId)
          const docSnap = await getDoc(restaurantRef)

          if (docSnap.exists()) {
            const restaurantData = docSnap.data();
            
            // Check if coordinates are valid (not 0,0)
            const hasValidCoordinates = restaurantData.coordinates && 
              restaurantData.coordinates.lat !== 0 && 
              restaurantData.coordinates.lng !== 0;
            
            if (!restaurantData.name) {
              setIsNewRestaurant(true);
            }
            // Initialize form data
            setFormData({
                name: restaurantData.name || '',
                address: restaurantData.address || '',
                website: restaurantData.website || '',
                notes: restaurantData.notes || '',
                menuCategories: (restaurantData.menuCategories || []).map((category: any) => ({
                  ...category,
                  items: category.items.map((item: any) => ({
                    ...item,
                    dietaryRestrictionsExplicitlySet: item.dietaryRestrictionsExplicitlySet || false
                  }))
                })),
                coordinates: hasValidCoordinates ? restaurantData.coordinates : { lat: 0, lng: 0 },
                createdAt: restaurantData.createdAt,
                updatedAt: restaurantData.updatedAt,
            });
            setOriginalAddress(restaurantData.address || '');
            
            // If coordinates are invalid and there's an address, trigger geocoding
            if (!hasValidCoordinates && restaurantData.address) {
              console.log('Invalid coordinates detected, will geocode address on next blur');
            }
          } else {
            setError('Restaurant not found.')
          }
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

  const handleMenuChange = (categoryIndex: number, itemIndex: number, field: keyof MenuItemFirestore, value: string | number | string[]) => {
    if (!formData) return;
    
    const newMenuCategories = [...formData.menuCategories];
    const item = newMenuCategories[categoryIndex].items[itemIndex];
    
    // Update the field with proper type handling
    if (field === 'name' || field === 'description') {
      item[field] = value as string;
    } else if (field === 'price') {
      item[field] = value as number;
    } else if (field === 'dietaryRestrictions') {
      if (Array.isArray(value)) {
        item[field] = value;
        // Mark that dietary restrictions were explicitly set
        item.dietaryRestrictionsExplicitlySet = true;
      }
    } else if (field === 'id') {
      item[field] = value as string;
    }
    
    // Auto-detect dietary restrictions when name or description changes, but only if not explicitly set
    if ((field === 'name' || field === 'description') && !item.dietaryRestrictionsExplicitlySet) {
      const nameText = field === 'name' ? value as string : item.name;
      const descText = field === 'description' ? value as string : item.description;
      const combinedText = `${nameText} ${descText}`;
      item.dietaryRestrictions = detectDietaryRestrictions(combinedText);
    }
    
    // Create a new form data object that preserves all existing fields, including coordinates
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        menuCategories: newMenuCategories,
        coordinates: prev.coordinates // Explicitly preserve coordinates
      };
    });
  };

  const handleCategoryNameChange = (categoryIndex: number, value: string) => {
    if (!formData) return;
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].name = value;
    setFormData(prev => ({ 
      ...prev!, 
      menuCategories: newMenuCategories,
      coordinates: prev!.coordinates // Explicitly preserve coordinates
    }));
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
          dietaryRestrictions: [],
          dietaryRestrictionsExplicitlySet: false
        }
      ]
    };
    
    const newMenuCategories = [...formData.menuCategories];
    const insertIndex = activeCategoryIndex === null ? newMenuCategories.length : activeCategoryIndex + 1;
    newMenuCategories.splice(insertIndex, 0, newCategory);

    setFormData(prev => ({ 
      ...prev!, 
      menuCategories: newMenuCategories,
      coordinates: prev!.coordinates // Explicitly preserve coordinates
    }));
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
      dietaryRestrictions: [],
      dietaryRestrictionsExplicitlySet: false
    };
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.push(newItem);
    const newItemIndex = newMenuCategories[categoryIndex].items.length - 1;
    setFormData(prev => ({ 
      ...prev!, 
      menuCategories: newMenuCategories,
      coordinates: prev!.coordinates // Explicitly preserve coordinates
    }));
    setNewlyAddedItem({ catIndex: categoryIndex, itemIndex: newItemIndex });
  }

  const deleteCategory = (categoryIndex: number) => {
    if (!formData) return;
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories.splice(categoryIndex, 1);
    setFormData(prev => ({ 
      ...prev!, 
      menuCategories: newMenuCategories,
      coordinates: prev!.coordinates // Explicitly preserve coordinates
    }));
  }

  const deleteItem = (categoryIndex: number, itemIndex: number) => {
    if (!formData) return;
    const newMenuCategories = [...formData.menuCategories];
    newMenuCategories[categoryIndex].items.splice(itemIndex, 1);
    setFormData(prev => ({ 
      ...prev!, 
      menuCategories: newMenuCategories,
      coordinates: prev!.coordinates // Explicitly preserve coordinates
    }));
  }

  const handleAddressBlur = () => {
    // If there's no address, just clear any old errors and do nothing else.
    if (!formData || !formData.address.trim()) {
      setAddressError(null);
      setAddressWarning(null);
      return;
    }

    // Check if coordinates are invalid (0,0) or if address has changed
    const hasValidCoordinates = formData.coordinates && 
      formData.coordinates.lat !== 0 && 
      formData.coordinates.lng !== 0;
    
    const addressChanged = formData.address !== originalAddress;
    
    // Always geocode if coordinates are invalid or address has changed
    if (!hasValidCoordinates || addressChanged) {
      startTransition(async () => {
        setAddressError(null);
        setAddressWarning(null);

        try {
          const response = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
          const data = await response.json();

          if (!response.ok) {
            setAddressError(data.error || 'Could not verify address.');
          } else {
            // Set the coordinates in formData
            setFormData(prev => ({
              ...prev!,
              coordinates: {
                lat: data.latitude,
                lng: data.longitude
              }
            }));

            if (data.quality === 'approximate') {
              setAddressWarning('Address is an approximate match. Please review or provide more detail.');
            } else {
              setAddressWarning(null);
            }
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          setAddressError('Could not verify address. Please check your network connection.');
        }
      });
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    // Validate required fields
    if (!formData.name || !formData.address) {
        setError('Name and address are required');
        return;
    }

    // Ensure coordinates are present
    if (!formData.coordinates) {
        setError('Coordinates are required');
        return;
    }

    // Check if coordinates are valid (not 0,0)
    if (formData.coordinates.lat === 0 && formData.coordinates.lng === 0) {
        console.warn('Coordinates are 0,0 - this might indicate a geocoding issue');
        setError('Please enter a valid address and wait for coordinates to be generated before saving.');
        return;
    }

    try {
        setError(null);
        const restaurantData = {
            name: formData.name,
            address: formData.address,
            coordinates: formData.coordinates,
            menuCategories: formData.menuCategories,
            notes: formData.notes || '',
            createdAt: formData.createdAt || new Date(),
            updatedAt: new Date()
        };

        if (restaurantId === 'new') {
            await addDoc(collection(db, 'restaurants'), restaurantData);
        } else {
            // Convert the data to the format Firestore expects for updates
            const updateData = {
                name: restaurantData.name,
                address: restaurantData.address,
                coordinates: restaurantData.coordinates,
                menuCategories: restaurantData.menuCategories,
                notes: restaurantData.notes,
                updatedAt: restaurantData.updatedAt
            };
            await updateDoc(doc(db, 'restaurants', restaurantId), updateData);
        }
        router.push('/restaurantsdatabase');
    } catch (err) {
        console.error('Error saving restaurant:', err);
        setError('Failed to save restaurant');
    }
  };

  const handleCancel = async () => {
    if (restaurantId === 'new') {
      // For a new, unsaved restaurant, just go back without trying to delete
      router.push('/restaurantsdatabase');
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

    if (restaurantId === 'new') {
      setError('Cannot delete a new restaurant that has not been saved yet.');
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
    try {
      const parsedJson = JSON.parse(jsonInput);
      
      // Validate the structure
      if (!parsedJson.menuCategories || !Array.isArray(parsedJson.menuCategories)) {
        setJsonError('Invalid JSON structure. Must contain a menuCategories array.');
        return;
      }

      // Define valid dietary restrictions
      const validRestrictions = [
        'vegetarian', 'vegan', 'pescatarian', 'gluten', 'crustaceans', 
        'eggs', 'fish-allergen', 'peanuts', 'soybeans', 'milk', 'nuts',
        'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
        'lactose-free', 'dairy-free', 'nut-free', 'egg-free', 'soy-free',
        'sesame-free', 'peanut-free', 'gluten-free', 'spicy', 
        'contains-alcohol', 'contains-sugar', 'low-carb', 'low-fat',
        'high-protein', 'halal', 'kosher'
      ];

      // Validate each category
      for (const category of parsedJson.menuCategories) {
        if (!category.name || !Array.isArray(category.items)) {
          setJsonError('Each category must have a name and an items array.');
          return;
        }

        // Validate each item
        for (const item of category.items) {
          if (!item.name || typeof item.price !== 'number') {
            setJsonError('Each item must have a name and a numeric price.');
            return;
          }
          // Ensure dietaryRestrictions is an array
          if (!item.dietaryRestrictions) {
            item.dietaryRestrictions = [];
          } else if (!Array.isArray(item.dietaryRestrictions)) {
            setJsonError('dietaryRestrictions must be an array.');
            return;
          }

          // Validate dietary restriction values
          const invalidRestrictions = item.dietaryRestrictions.filter(
            (restriction: string) => !validRestrictions.includes(restriction)
          );
          if (invalidRestrictions.length > 0) {
            setJsonError(`Invalid dietary restrictions: ${invalidRestrictions.join(', ')}. Please use valid values from the guide.`);
            return;
          }

          // Mark dietary restrictions as explicitly set if they were provided in JSON
          if (item.dietaryRestrictions.length > 0) {
            item.dietaryRestrictionsExplicitlySet = true;
          }
        }
      }

      // Update form data with the parsed JSON
      setFormData(prev => ({
        ...prev!,
        menuCategories: parsedJson.menuCategories
      }));
      setJsonError(null);
      setJsonSuccess('Menu updated successfully!');
    } catch (error) {
      setJsonError('Invalid JSON format.');
      setJsonSuccess(null);
    }
  };

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
              warning={!!jsonSuccess}
              warningMessage={jsonSuccess || undefined}
              placeholder={`{
  "menuCategories": [
    {
      "name": "Appetizers",
      "items": [
        {
          "id": "unique-id-1",
          "name": "Fries, Classic or seasoned with chaat masala",
          "description": "Crispy fries with optional chaat masala seasoning",
          "price": 8.50,
          "dietaryRestrictions": ["vegan", "gluten-free"]
        }
      ]
    }
  ]
}

// DIETARY RESTRICTIONS GUIDE:
// Use these exact values in dietaryRestrictions array:
// 
// LIFESTYLES: "vegetarian", "vegan", "pescatarian"
// 
// ALLERGENS: "gluten", "crustaceans", "eggs", "fish-allergen", 
//            "peanuts", "soybeans", "milk", "nuts", "celery", 
//            "mustard", "sesame", "sulphites", "lupin", "molluscs"
// 
// FREE FROM: "lactose-free", "dairy-free", "nut-free", "egg-free",
//            "soy-free", "sesame-free", "peanut-free", "gluten-free"
// 
// OTHER: "spicy", "contains-alcohol", "contains-sugar", "low-carb",
//        "low-fat", "high-protein", "halal", "kosher"`}
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
                    <div className="flex-1 flex items-center">
                      <Input 
                        placeholder="Description" 
                        value={item.description || ''} 
                        onFocus={() => setActiveCategoryIndex(categoryIndex)} 
                        onChange={(e) => handleMenuChange(categoryIndex, itemIndex, 'description', e.target.value)} 
                        className="w-full text-sm" 
                      />
                      <DietaryDropdown
                        value={item.dietaryRestrictions || []}
                        onChange={(value) => handleMenuChange(categoryIndex, itemIndex, 'dietaryRestrictions', value)}
                      />
                    </div>
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
      <footer className="fixed bottom-0 left-0 right-0" style={{ zIndex: 11000, borderTop: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
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
                              name: "Appetizers",
                              items: [
                                {
                                  id: "item-id",
                                  name: "Fries, Classic or seasoned with chaat masala",
                                  description: "Crispy fries with optional chaat masala seasoning",
                                  price: 8.50,
                                  dietaryRestrictions: ["vegan", "gluten-free"]
                                }
                              ]
                            }
                          ]
                        }
                        const jsonString = JSON.stringify(jsonFormat, null, 2) + `

// DIETARY RESTRICTIONS GUIDE:
// Use these exact values in dietaryRestrictions array:
// 
// LIFESTYLES: "vegetarian", "vegan", "pescatarian"
// 
// ALLERGENS: "gluten", "crustaceans", "eggs", "fish-allergen", 
//            "peanuts", "soybeans", "milk", "nuts", "celery", 
//            "mustard", "sesame", "sulphites", "lupin", "molluscs"
// 
// FREE FROM: "lactose-free", "dairy-free", "nut-free", "egg-free",
//            "soy-free", "sesame-free", "peanut-free", "gluten-free"
// 
// OTHER: "spicy", "contains-alcohol", "contains-sugar", "low-carb",
//        "low-fat", "high-protein", "halal", "kosher"`;
                        navigator.clipboard.writeText(jsonString)
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