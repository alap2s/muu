'use client'

import React from 'react'
import { MenuItemRow } from './MenuItemRow'
import type { MenuItem } from '../page'
import type { ViewMode } from '../contexts/ViewModeContext'
import { useIsMobile } from '../hooks/useIsMobile'

interface MenuCategoryRowProps {
  category: string
  items: MenuItem[]
  expandedItems: Set<string>
  toggleItemExpansion: (itemId: string) => void
  getDietaryIcons: (item: MenuItem) => React.ReactNode[]
  viewMode: ViewMode
  categoryRef: (el: HTMLDivElement | null) => void
  headerHeight?: number
}

export const MenuCategoryRow: React.FC<MenuCategoryRowProps> = ({
  category,
  items,
  expandedItems,
  toggleItemExpansion,
  getDietaryIcons,
  viewMode,
  categoryRef,
  headerHeight,
}) => {
  const isMobile = useIsMobile()
  // Desktop header is 48px (logo area) + 48px (nav) + 1px border = 97px
  // Mobile header is just the logo area (48px)
  const stickyTopOffsetValue = headerHeight !== undefined ? headerHeight : isMobile ? 48 : 97
  const stickyTopOffset = `${stickyTopOffsetValue}px`

  return (
    <div ref={categoryRef}>
      <div
        className="flex justify-center"
        style={{
          borderBottom: '1px solid var(--border-main)',
          position: 'sticky',
          top: stickyTopOffset,
          zIndex: 10,
          background: 'var(--background-main)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 48,
            borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
            background: 'var(--background-main)',
          }}
        />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }}>
          <h3
            style={{
              color: 'var(--text-primary)',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 16,
              textTransform: 'uppercase',
              fontWeight: 800,
              fontSize: 10,
            }}
          >
            {category}
          </h3>
        </div>
        <div
          style={{
            width: 32,
            height: 48,
            borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
            background: 'var(--background-main)',
          }}
        />
      </div>
      <div className="space-y-0" role="list">
        {items.map((item) => (
          <MenuItemRow
            key={item.id}
            item={item}
            expanded={expandedItems.has(item.id)}
            onClick={() => toggleItemExpansion(item.id)}
            getDietaryIcons={getDietaryIcons}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  )
} 