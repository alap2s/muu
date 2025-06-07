'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ListItemProps {
  title: string
  subtitle?: string
  onClick?: () => void
  endContent?: React.ReactNode
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  onClick,
  endContent = <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />,
}) => {
  const isClickable = !!onClick
  const Component = isClickable ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className="flex justify-between items-center w-full text-left px-4 py-2"
      disabled={!isClickable}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        minHeight: '48px',
      }}
    >
      <div className="flex flex-col flex-1 min-w-0 mr-4">
        <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        {subtitle && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </span>
        )}
      </div>
      {endContent}
    </Component>
  )
} 