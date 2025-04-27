import { useState, useEffect, useRef } from 'react'
import { Restaurant, MenuItem } from '../types'
import { MapPin, Clock, DollarSign, ExternalLink, ChefHat, Leaf, Vegan, Filter, ChevronDown } from 'lucide-react'

interface RestaurantCardProps {
  restaurant: Restaurant
  onClose: () => void
}

export default function RestaurantCard({ restaurant, onClose }: RestaurantCardProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isScrolling, setIsScrolling] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Get unique categories from menu items
  const categories = Array.from(new Set((restaurant.menu || []).map(item => item.category || '')))

  useEffect(() => {
    if (categories.length > 0) {
      setSelectedGroup(categories[0])
    }
  }, [categories])

  useEffect(() => {
    const handleScroll = () => {
      if (!menuRef.current || isScrolling) return

      const menuContainer = menuRef.current
      const scrollTop = menuContainer.scrollTop
      const containerHeight = menuContainer.clientHeight

      // Find the current visible group
      let currentGroup = ''
      for (const [group, ref] of Object.entries(groupRefs.current)) {
        if (ref) {
          const rect = ref.getBoundingClientRect()
          const menuRect = menuContainer.getBoundingClientRect()
          const relativeTop = rect.top - menuRect.top

          if (relativeTop <= 0 && relativeTop + rect.height > 0) {
            currentGroup = group
            break
          }
        }
      }

      if (currentGroup && currentGroup !== selectedGroup) {
        setSelectedGroup(currentGroup)
      }
    }

    const menuContainer = menuRef.current
    if (menuContainer) {
      menuContainer.addEventListener('scroll', handleScroll)
      return () => menuContainer.removeEventListener('scroll', handleScroll)
    }
  }, [selectedGroup, isScrolling])

  const scrollToGroup = (group: string) => {
    setIsScrolling(true)
    const groupElement = groupRefs.current[group]
    if (groupElement && menuRef.current) {
      const menuContainer = menuRef.current
      const groupTop = groupElement.offsetTop
      menuContainer.scrollTo({
        top: groupTop,
        behavior: 'smooth'
      })
      setSelectedGroup(group)
      setTimeout(() => setIsScrolling(false), 500)
    }
  }

  // Group menu items by category
  const groupedMenu = (restaurant.menu || []).reduce((acc, item) => {
    const category = item.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as { [key: string]: MenuItem[] })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{restaurant.name}</h2>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{restaurant.distance} km away</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {categories.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedGroup}
              onChange={(e) => scrollToGroup(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          ref={menuRef}
          className="overflow-y-auto max-h-[60vh] pr-4"
        >
          {Object.entries(groupedMenu).map(([category, items]) => (
            <div
              key={category}
              ref={(el) => (groupRefs.current[category] = el)}
              className="mb-6"
            >
              <h3 className="text-xl font-semibold mb-3 sticky top-0 bg-white py-2">
                {category}
              </h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        €{item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.dietaryRestrictions && item.dietaryRestrictions.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {item.dietaryRestrictions.includes('vegetarian') && (
                          <span className="flex items-center text-green-600 text-sm">
                            <Leaf className="w-4 h-4 mr-1" />
                            Vegetarian
                          </span>
                        )}
                        {item.dietaryRestrictions.includes('vegan') && (
                          <span className="flex items-center text-green-600 text-sm">
                            <Vegan className="w-4 h-4 mr-1" />
                            Vegan
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {restaurant.website && (
          <div className="mt-4 text-center">
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Visit Restaurant Website
            </a>
          </div>
        )}
      </div>
    </div>
  )
} 