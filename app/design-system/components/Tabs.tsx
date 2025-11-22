'use client'

import React from 'react'
import { VDivider } from './VDivider'

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
  const baseStyles = "h-12 font-mono transition-colors flex items-center";

  const renderButtons = () =>
    tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const style: React.CSSProperties = {
          minWidth: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          background: isActive ? 'var(--accent)' : 'var(--background-main)',
          color: isActive ? 'var(--background-main)' : 'var(--accent)',
        // No borders here; separators come from VDivider between buttons
          flex: 1
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
    });

  // Interleave vertical dividers between tab buttons
  const children = renderButtons();
  const interleaved: React.ReactNode[] = [];
  children.forEach((child, i) => {
    if (i > 0) interleaved.push(<VDivider key={`tab-sep-${i}`} />);
    interleaved.push(child);
  });

  return (
    <div className={`flex ${className}`}>
      {interleaved}
    </div>
  )
} 