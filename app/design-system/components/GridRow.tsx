'use client'

import React, { ReactNode, CSSProperties, forwardRef } from 'react'
import { VDivider } from './VDivider'
import { useViewMode } from '../../contexts/ViewModeContext'

interface GridRowProps {
  children: ReactNode
  // Deprecated props kept for compatibility; they are ignored internally
  showRails?: boolean
  borderTop?: boolean
  borderBottom?: boolean

  maxWidth?: number
  minHeight?: number | string
  className?: string
  centerStyle?: CSSProperties
  // If undefined, defaults from viewMode: grid=true, list=false
  separators?: boolean
}

export const GridRow = forwardRef<HTMLDivElement, GridRowProps>(function GridRow({
  children,
  // Deprecated (ignored)
  showRails,
  borderTop,
  borderBottom,

  maxWidth = 800,
  minHeight = 48,
  className = '',
  centerStyle = {},
  separators,
}: GridRowProps, ref) {
  const { viewMode } = useViewMode()
  const effectiveSeparators = separators ?? (viewMode === 'grid')
  const centerChildren = React.Children.toArray(children).filter(Boolean)
  const interleave = (nodes: ReactNode[]) => {
    if (!effectiveSeparators) return nodes
    const out: ReactNode[] = []
    nodes.forEach((n, i) => {
      if (i > 0) out.push(<VDivider key={`sep-${i}`} />)
      out.push(n)
    })
    return out
  }

  const leftRail = (
    <div
      style={{
        flex: 1,           // grow to edges on wide viewports
        minWidth: 32,      // never smaller than 32 (mobile)
        minHeight,
        background: 'var(--background-main)',
      }}
    />
  )

  const center = (
    <div
      style={{
        flex: `0 1 ${maxWidth}px`, // cap center to maxWidth; allow shrink on smaller screens
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        minHeight,
        background: 'var(--background-main)',
        overflow: 'hidden',
        ...centerStyle,
      }}
    >
      {interleave(centerChildren)}
    </div>
  )

  const rightRail = (
    <div
      style={{
        flex: 1,
        minWidth: 32,
        minHeight,
        background: 'var(--background-main)',
      }}
    />
  )

  const topLevel = interleave([leftRail, center, rightRail])

  return (
    <div ref={ref} className={`flex ${className}`} style={{ width: '100%' }}>
      {topLevel}
    </div>
  )
}) 