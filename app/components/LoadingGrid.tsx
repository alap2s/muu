'use client'

import { useViewMode } from '../contexts/ViewModeContext'

export function LoadingGrid() {
  const { viewMode } = useViewMode()

  return (
    <div className="space-y-0">
      {[...Array(24)].map((_, i) => (
        <div key={i} className="flex justify-center">
          <div
            style={{
              width: 32,
              height: i >= 1 && i <= 8 ? 'auto' : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
              borderRight: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none',
              borderBottom: 'var(--border-hairline-solid)',
              background: 'var(--background-main)'
            }}
            role="presentation"
          />
          <div 
            style={{ 
              flex: 1, 
              maxWidth: 1024, 
              borderBottom: 'var(--border-hairline-solid)', 
              background: 'var(--background-main)', 
              height: i >= 1 && i <= 8 ? 48 : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} 
          />
          <div
            style={{
              width: 32,
              height: i >= 1 && i <= 8 ? 'auto' : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
              borderLeft: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none',
              borderBottom: 'var(--border-hairline-solid)',
              background: 'var(--background-main)'
            }}
            role="presentation"
          />
        </div>
      ))}
    </div>
  )
} 