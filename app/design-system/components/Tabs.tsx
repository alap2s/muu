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
}

export function Tabs<T extends string>({ tabs, activeTab, onTabChange, className = '' }: TabsProps<T>) {
  return (
    <div className={`flex ${className}`}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as T)}
          className={`h-12 font-mono transition-colors flex items-center ${
            activeTab === tab.id
              ? 'bg-accent text-background-main'
              : 'bg-background-main text-accent'
          }`}
          style={{
            minWidth: 48,
            height: 48,
            padding: '0 16px',
            border: '1px solid var(--border-main)',
            borderRight: index === tabs.length - 1 ? '1px solid var(--border-main)' : 'none'
          }}
        >
          <span className="text-[14px] font-mono">{tab.label}</span>
        </button>
      ))}
    </div>
  )
} 