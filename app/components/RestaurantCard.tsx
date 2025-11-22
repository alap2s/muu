import { useState, useEffect, useRef } from 'react'
import { Restaurant, MenuItem as MenuItemType } from '../types'
import { Filter, ChevronDown } from 'lucide-react'
import { useViewMode } from '../contexts/ViewModeContext'

interface RestaurantCardProps {
  restaurant: Restaurant
  onClose: () => void
}

export default function RestaurantCard({ restaurant, onClose }: RestaurantCardProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isScrolling, setIsScrolling] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const { viewMode } = useViewMode()

  // Get unique categories from menu items
  const categories = Array.from(new Set(restaurant.menu?.map(item => item.category).filter((category): category is string => category !== undefined) ?? []))

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
  const groupedMenu = (restaurant.menu ?? []).reduce((acc, item) => {
    const category = item.category
    if (category) {
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
    }
    return acc
  }, {} as { [key: string]: MenuItemType[] })

  const menuGroups = Object.entries(groupedMenu).map(([category, items]) => ({
    title: category,
    items: items.map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      dietaryRestrictions: item.dietaryRestrictions
    }))
  }))

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      viewMode === 'grid' 
        ? 'border border-border-main' 
        : 'border-t border-b border-border-main'
    }`}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden">
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
        <div ref={menuRef} className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {menuGroups.map(group => (
            <div key={group.title} ref={el => { groupRefs.current[group.title] = el; }}>
              <div className="font-bold text-lg mb-2" style={{ borderBottom: 'var(--border-hairline-solid)' }}>{group.title}</div>
              {group.items.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center"
                  style={{
                    borderBottom: 'var(--border-hairline-solid)',
                  }}
                >
                  <div
                    className={`flex-1 p-2 ${
                      viewMode === 'grid'
                        ? 'border-l border-r border-border-main'
                        : ''
                    }`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                    <div className="text-sm font-medium">{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 