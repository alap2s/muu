'use client'

import React, { ReactNode } from 'react'
import { GridRow } from './GridRow'
import { VDivider } from './VDivider'

interface HeaderProps {
  left?: ReactNode | ReactNode[]
  center?: ReactNode | ReactNode[]
  right?: ReactNode | ReactNode[]
  showRails?: boolean
  borderBottom?: boolean
  maxWidth?: number
  minHeight?: number | string
  className?: string
  slotSeparators?: { left?: boolean; center?: boolean; right?: boolean }
}

export function Header({
  left,
  center,
  right,
  showRails = true,
  borderBottom = true,
  maxWidth = 800,
  minHeight = 48,
  className = '',
  slotSeparators,
}: HeaderProps) {
  const opts = {
    left: slotSeparators?.left ?? false,
    center: slotSeparators?.center ?? false,
    right: slotSeparators?.right ?? true,
  }

  const renderSlot = (content: ReactNode | ReactNode[] | undefined, withSeparators: boolean, extraStyle?: React.CSSProperties, roleAttr?: string) => {
    if (!content) return null
    const items = Array.isArray(content) ? content : [content]
    const children: React.ReactNode[] = []
    items.forEach((item, i) => {
      if (i > 0 && withSeparators) children.push(<VDivider key={`sep-${i}`} />)
      children.push(<div key={`item-${i}`} style={{ display: 'flex', alignItems: 'center' }}>{item}</div>)
    })
    return (
      <div style={{ display: 'flex', alignItems: 'center', minHeight, gap: 0, ...extraStyle }} role={roleAttr}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--background-main)' }}>
      <GridRow
        showRails={showRails}
        borderBottom={false}
        maxWidth={maxWidth}
        minHeight={minHeight}
        className={className}
        /* Let GridRow decide separators by viewMode unless a page overrides on its own rows */
      >
        {renderSlot(left, opts.left)}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          {renderSlot(center, opts.center, { width: '100%' })}
        </div>
        {renderSlot(right, opts.right, undefined, 'toolbar')}
      </GridRow>
    </div>
  )
}

