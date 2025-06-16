'use client'

import React from 'react'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  const baseStyles = "h-12 font-mono transition-colors flex items-center"
  
  return (
    <div className={`flex ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const style: React.CSSProperties = {
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: isActive ? 'var(--accent)' : 'var(--background-main)',
          color: isActive ? 'var(--background-main)' : 'var(--accent)',
          border: '1px solid var(--border-main)',
          borderRight: 'none'
        }

        // Add right border to last tab
        if (tab.id === tabs[tabs.length - 1].id) {
          style.borderRight = '1px solid var(--border-main)'
        }

        return (
          <button
            key={tab.id}
            className={`${baseStyles} ${className}`}
            style={style}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="flex items-center text-[14px] font-mono whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
} 