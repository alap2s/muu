'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc, GeoPoint } from 'firebase/firestore'
import { useViewMode } from '../../contexts/ViewModeContext'
import { Button } from '../../design-system/components/Button'
import { Edit, Loader2, Leaf, Milk, Fish, Nut, Bird, Egg, Beef, WheatOff, Flame, ArrowLeft, Heart, CornerUpRight, Layers, Filter } from 'lucide-react'
import { Dropdown } from '../../design-system/components/Dropdown'
import { ListItem } from '../../design-system/components/ListItem'
import { MenuCategoryRow } from '../../components/MenuCategoryRow'
import { DetailRow } from '../../components/DetailRow'
import { NoteRow } from '../../components/NoteRow'

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
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { viewMode } = useViewMode()
  const { id: restaurantId } = params
  const [likes, setLikes] = useState<number>(128)
  const [liked, setLiked] = useState<boolean>(false)
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'vegetarian' | 'vegan' | 'gluten-free' | 'spicy' | 'nuts'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const categoryOptions = (restaurant?.menuCategories || []).map(c => ({ value: c.name, label: c.name }))

  const toggleItemExpansion = (itemId: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpandedNotes = new Set(expandedNotes);
    if (newExpandedNotes.has(noteId)) {
      newExpandedNotes.delete(noteId);
    } else {
      newExpandedNotes.add(noteId);
    }
    setExpandedNotes(newExpandedNotes);
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
  
  const handleBack = () => router.back()
  const toggleLike = () => {
    setLiked(prev => !prev)
    setLikes(prev => prev + (liked ? -1 : 1))
  }
  const openInMaps = () => {
    if (!restaurant) return
    const q = encodeURIComponent(restaurant.address || restaurant.name)
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer')
  }

  const detailItems = restaurant ? [
    { label: 'Name', value: restaurant.name },
    { label: 'Address', value: restaurant.address },
    { label: 'Website', value: restaurant.website },
    { label: 'GPS', value: restaurant.coordinates ? `${restaurant.coordinates.lat.toFixed(5)}, ${restaurant.coordinates.lng.toFixed(5)}` : undefined },
  ] : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }}>
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      <header className="flex flex-col sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div className="flex justify-center">
          <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
          <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleBack} aria-label="Go back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-base font-semibold" style={{ color: 'var(--accent)' }}>Details</h1>
            </div>
            <Button variant="secondary" onClick={toggleLike} aria-label="Like restaurant" className="px-3">
              {liked ? <Heart className="w-4 h-4 mr-1" fill="currentColor" /> : <Heart className="w-4 h-4 mr-1" />}
              <span className="text-sm" style={{ color: 'var(--accent)' }}>{likes}</span>
            </Button>
          </div>
          <div style={{ width: 32, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
        </div>
        {/* Sticky filters - desktop (reuse Dropdowns like Places) */}
        <div className="hidden md:flex justify-center" style={{ borderTop: '1px solid var(--border-main)' }} aria-label="Details navigation">
          <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
          <div className="flex-1 flex min-w-0 max-w-[800px]">
            <div className="flex-1 min-w-0">
              <Dropdown
                value={dietaryFilter}
                onChange={(v) => setDietaryFilter(v as any)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'gluten-free', label: 'Gluten-free' },
                  { value: 'spicy', label: 'Spicy' },
                  { value: 'nuts', label: 'Nuts' },
                ]}
                leftIcon={<Filter className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
                position="bottom"
                aria-label="Filter dietary"
              />
            </div>
            <div className="flex-none w-12">
              <Dropdown
                value={categoryFilter}
                onChange={(v) => setCategoryFilter(v)}
                options={categoryOptions}
                leftIcon={<Layers className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
                position="bottom"
                align="right"
                hideChevron={true}
                className="justify-center"
                aria-label="Filter category"
              />
            </div>
          </div>
          <div style={{ width: 32, background: 'var(--background-main)' }} />
        </div>
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
            {/* Top info rows */}
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0' }} className="min-w-0">
                <ListItem title={restaurant.name} onClick={undefined} />
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
            <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0' }} className="min-w-0">
                <ListItem
                  title={restaurant.address}
                  subtitle="Address"
                  onClick={openInMaps}
                  endContent={<CornerUpRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
                />
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
            {restaurant.notes && (
              <NoteRow
                id="restaurant-notes"
                content={restaurant.notes}
                expanded={expandedNotes.has("restaurant-notes")}
                onClick={toggleNoteExpansion}
                viewMode={viewMode}
              />
            )}
            {restaurant.menuCategories && restaurant.menuCategories
              .map(category => ({
                name: category.name,
                items: category.items
                  .filter(item => {
                    if (dietaryFilter === 'all') return true
                    if (dietaryFilter === 'vegetarian') return item.dietaryRestrictions.includes('vegetarian')
                    if (dietaryFilter === 'vegan') return item.dietaryRestrictions.includes('vegan')
                    if (dietaryFilter === 'gluten-free') return item.dietaryRestrictions.includes('gluten-free')
                    if (dietaryFilter === 'spicy') return item.dietaryRestrictions.includes('spicy')
                    if (dietaryFilter === 'nuts') return item.dietaryRestrictions.includes('nuts')
                    return true
                  })
              }))
              .filter(cat => (categoryFilter ? cat.name === categoryFilter : true))
              .map(category => (
                <MenuCategoryRow
                  key={category.name}
                  category={category.name}
                  items={category.items.map(item => ({ ...item, category: category.name }))}
                  expandedItems={expandedItems}
                  toggleItemExpansion={toggleItemExpansion}
                  getDietaryIcons={getDietaryIcons}
                  viewMode={viewMode}
                  categoryRef={() => {}}
                  headerHeight={48}
                />
              ))}
          </>
        )}
      </main>

      {/* Mobile bottom filters bar */}
      {restaurant && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: 'var(--background-main)' }}>
          <div className="max-w-4xl mx-auto">
            <div style={{ borderTop: '1px solid var(--border-main)' }}>
              <div className="flex w-full" style={{ borderBottom: '1px solid var(--border-main)' }}>
                <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                <div className="flex-1 flex min-w-0">
                  <div className="flex-1 min-w-0">
                    <Dropdown
                      value={dietaryFilter}
                      onChange={(v) => setDietaryFilter(v as any)}
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'vegetarian', label: 'Vegetarian' },
                        { value: 'vegan', label: 'Vegan' },
                        { value: 'gluten-free', label: 'Gluten-free' },
                        { value: 'spicy', label: 'Spicy' },
                        { value: 'nuts', label: 'Nuts' },
                      ]}
                      leftIcon={<Filter className="w-4 h-4" strokeWidth={2} />}
                      position="top"
                    />
                  </div>
                  <div className="flex-none w-12">
                    <Dropdown
                      value={categoryFilter}
                      onChange={(v) => setCategoryFilter(v)}
                      options={categoryOptions}
                      leftIcon={<Layers className="w-4 h-4" strokeWidth={2} />}
                      position="top"
                      align="right"
                      hideChevron={true}
                      className="justify-center"
                    />
                  </div>
                </div>
                <div style={{ width: 32, height: 48, background: 'var(--background-main)' }} />
              </div>
            </div>
            <div style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div className="flex h-8">
                <div className="w-8" style={{ borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                <div className="flex-1" style={{ borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                <div className="w-8" style={{ background: 'var(--background-main)' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 