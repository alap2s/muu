'use client'

import React from 'react'

interface Tab {
  id: string
  label: string
}

interface TabsProps<T extends string> {
  tabs: Tab[]
  activeTab: T
  onTabChange: (tabId: T) => void
  className?: string
  equalWidth?: boolean
}

export function Tabs<T extends string>({ tabs, activeTab, onTabChange, className = '', equalWidth = false }: TabsProps<T>) {
  const baseStyles = "h-12 font-mono transition-colors flex items-center";

  return (
    <div className={`flex ${className}`}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const style: React.CSSProperties = {
          height: 48,
          display: 'flex',
          alignItems: 'center',
          background: isActive ? 'var(--accent)' : 'var(--background-main)',
          color: isActive ? 'var(--background-main)' : 'var(--accent)',
          border: '1px solid var(--border-main)',
          borderRight: index === tabs.length - 1 ? '1px solid var(--border-main)' : 'none',
          ...(equalWidth
            ? { flex: 1, justifyContent: 'center' }
            : { minWidth: 48, padding: '0 16px' })
        };

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as T)}
            className={baseStyles}
            style={style}
          >
            <span className="text-[14px] font-mono">{tab.label}</span>
          </button>
        );
      })}
    </div>
  )
} 