'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ListItemProps {
  title: string
  subtitle?: string
  onClick?: () => void
  endContent?: React.ReactNode
  wrapTitle?: boolean
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  onClick,
  endContent = null,
  wrapTitle = false,
}) => {
  const isClickable = !!onClick
  const Component = isClickable ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className="flex justify-between items-center w-full text-left px-4 py-6"
      disabled={!isClickable}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        minHeight: '48px',
      }}
    >
      <div className="flex flex-col flex-1 min-w-0 mr-4">
        <span className={`text-sm ${wrapTitle ? '' : 'truncate'}`} style={{ color: 'var(--text-primary)', whiteSpace: wrapTitle ? 'normal' : undefined }}>
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