'use client'

import React, { CSSProperties } from 'react'

interface VDividerProps {
  marginX?: number
  style?: CSSProperties
  className?: string
}

export function VDivider({ marginX = 0, style = {}, className = '' }: VDividerProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        alignSelf: 'stretch',
        width: 0,
        borderLeft: 'var(--border-hairline-solid)' as any,
        marginLeft: marginX,
        marginRight: marginX,
        ...style,
      }}
    />
  )
}

