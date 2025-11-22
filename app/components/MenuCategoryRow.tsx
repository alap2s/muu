'use client'

import React from 'react'
import { MenuItemRow } from './MenuItemRow'
import type { MenuItem } from '../page'
import type { ViewMode } from '../contexts/ViewModeContext'
import { GridRow } from '../design-system/components/GridRow'
/* no local stack; parent PageContentStack will handle separators */

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
  headerHeight: _headerHeight,
}) => {
  return (
    <>
      <GridRow ref={categoryRef} showRails={viewMode === 'grid'} maxWidth={800} minHeight={48} centerStyle={{ paddingLeft: 16 }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <h3
            style={{
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              fontWeight: 800,
              fontSize: 10,
            }}
          >
            {category}
          </h3>
        </div>
      </GridRow>
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
    </>
  )
} 