'use client'

import { useLoading } from '../contexts/LoadingContext'
import { LoadingGrid } from './LoadingGrid'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLoading()
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Don't show loading state on initial mount
  if (!isMounted) {
    return <>{children}</>
  }
  
  // Show loading grid only when navigating between pages
  if (isLoading && pathname !== '/settings') {
    return <LoadingGrid />
  }
  
  return <>{children}</>
} 