'use client'

import { ReactNode } from 'react'

interface GridRowProps {
  children: ReactNode
  className?: string
  leftBoxClassName?: string
  rightBoxClassName?: string
  contentClassName?: string
}

export function GridRow({
  children,
  className = '',
  leftBoxClassName = '',
  rightBoxClassName = '',
  contentClassName = '',
}: GridRowProps) {
  return (
    <div className={`flex ${className}`}>
      <div className={`w-8 h-12 border-r border-primary-border bg-primary-light ${leftBoxClassName}`} />
      <div className={`flex-1 ${contentClassName}`}>{children}</div>
      <div className={`w-8 h-12 bg-primary-light ${rightBoxClassName}`} />
    </div>
  )
} 