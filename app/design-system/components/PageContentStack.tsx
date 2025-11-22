'use client'

import React, { ReactNode, HTMLAttributes } from 'react'

interface PageContentStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

// Wraps page content rows and adds horizontal separators between direct children
export function PageContentStack({ children, className = '', ...rest }: PageContentStackProps) {
  return <div className={`ds-stack ${className}`} {...rest}>{children}</div>
}



