'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc, GeoPoint } from 'firebase/firestore'
import { useViewMode } from '../../contexts/ViewModeContext'
import { Button } from '../../design-system/components/Button'
import { Edit, Loader2, Leaf, Milk, Fish, Nut, Bird, Egg, Beef, WheatOff, Flame } from 'lucide-react'
import { MenuCategoryRow } from '../../components/MenuCategoryRow'
import { DetailRow } from '../../components/DetailRow'

// This is the shape of the data that getDietaryIcons expects
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string; // The category name
  dietaryRestrictions: string[];
}

// Interfaces matching the Firestore structure
interface MenuItemFirestore {
  id: string;
  name: string;
  description?: string;
  price: number;
  dietaryRestrictions: string[];
}

interface MenuCategoryFirestore {
  name:string;
  items: MenuItemFirestore[];
}

interface RestaurantDetails {
  id: string;
  name: string;
  address: string;
  website?: string;
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  menuCategories: MenuCategoryFirestore[];
}

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { viewMode } = useViewMode()
  const { id: restaurantId } = params

  const toggleItemExpansion = (itemId: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  const getDietaryIcons = (item: MenuItem) => {
    const icons = []
    const name = item.name.toLowerCase()
    const description = item.description?.toLowerCase() || ''
    const combinedText = `${name} ${description}`;

    // --- Explicit Restrictions ---
    // These are based on data saved in the database and are the most reliable.
    if (item.dietaryRestrictions.includes('vegan')) {
      icons.push(<Leaf key="vegan" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
    } else if (item.dietaryRestrictions.includes('vegetarian')) {
      icons.push(<Milk key="vegetarian" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
    }
    
    // --- Inferred & Explicit Restrictions ---
    // These can be explicitly set or inferred from keywords.
    if (item.dietaryRestrictions.includes('gluten-free') || /\b(gluten-free|glutenfrei)\b/.test(combinedText)) {
        icons.push(<WheatOff key="gluten-free" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />);
    }
    if (item.dietaryRestrictions.includes('spicy') || /\b(spicy|scharf|hot|chili)\b/.test(combinedText)) {
        icons.push(<Flame key="spicy" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />);
    }
    if (item.dietaryRestrictions.includes('nuts') || /\b(nuts?|almond|cashew|walnut|peanut|nuss|mandel|erdnuss)\b/.test(combinedText)) {
      icons.push(<Nut key="nuts" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
    }

    // --- Purely Inferred Restrictions ---
    // This block only runs if the item is not explicitly vegan or vegetarian.
    if (!item.dietaryRestrictions.includes('vegetarian') && !item.dietaryRestrictions.includes('vegan')) {
      if (/\b(chicken|turkey|duck|hähnchen|geflügel|pute|ente)\b/.test(combinedText)) {
        icons.push(<Bird key="poultry" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else if (/\b(egg|ei)\b/.test(combinedText)) {
        icons.push(<Egg key="egg" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else if (/\b(fish|tuna|salmon|lachs|fisch|thunfisch|shrimp|prawn|crab|lobster|seafood|meeresfrüchte|garnele|krabbe)\b/.test(combinedText)) {
        icons.push(<Fish key="fish" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      } else if (/\b(beef|steak|rind|ham|schinken|pork|bacon|schwein|speck|kalb)\b/.test(combinedText)) {
        icons.push(<Beef key="meat" className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />)
      }
    }
    return icons
  }

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
  
  const handleEditClick = () => {
    router.push(`/restaurants/${restaurantId}/edit`);
  }

  const detailItems = restaurant ? [
    { label: 'Name', value: restaurant.name },
    { label: 'Address', value: restaurant.address },
    { label: 'Website', value: restaurant.website },
    { label: 'Notes', value: restaurant.notes },
    { label: 'GPS', value: restaurant.coordinates ? `${restaurant.coordinates.lat.toFixed(5)}, ${restaurant.coordinates.lng.toFixed(5)}` : undefined },
  ] : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }}>
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      <header className="flex justify-center" style={{ position: 'sticky', top: 'env(safe-area-inset-top)', zIndex: 20, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <h1 className="text-base font-semibold pl-4" style={{ color: 'var(--accent)' }}>Details</h1>
          <Button variant="secondary" onClick={handleEditClick} aria-label="Edit restaurant details">
            <Edit className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>

      <main>
        {loading && (
          <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 48px - env(safe-area-inset-top))' }}>
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {error && <p className="text-red-500 p-4">{error}</p>}
        {restaurant && (
          <>
            {detailItems.map(item => item.value ? <DetailRow key={item.label} label={item.label} value={item.value} viewMode={viewMode} /> : null)}
            {restaurant.menuCategories && restaurant.menuCategories.map(category => (
              <MenuCategoryRow
                key={category.name}
                category={category.name}
                items={category.items.map(item => ({ ...item, category: category.name }))} // Add category name to each item
                expandedItems={expandedItems}
                toggleItemExpansion={toggleItemExpansion}
                getDietaryIcons={getDietaryIcons}
                viewMode={viewMode}
                categoryRef={() => {}} // Not needed for scrolling here
                headerHeight={48}
              />
            ))}
          </>
        )}
      </main>
    </div>
  )
} 