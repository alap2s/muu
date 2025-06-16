"use client"
import { useEffect } from 'react'

export function FontInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFont = localStorage.getItem('font') as 'jetbrains' | 'atkinson'
      if (savedFont === 'atkinson') {
        document.documentElement.classList.add('font-atkinson')
      } else {
        document.documentElement.classList.remove('font-atkinson')
      }
    }
  }, [])
  return null
} 