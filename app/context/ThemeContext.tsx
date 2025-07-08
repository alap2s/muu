'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// Define theme and color mode options
const THEME_MODES = ['auto', 'light', 'dark'] as const
type ThemeMode = typeof THEME_MODES[number]
const COLOR_MODES = ['brand', 'gray'] as const
type ColorMode = typeof COLOR_MODES[number]

interface ThemeContextType {
  themeMode: ThemeMode
  colorMode: ColorMode
  setThemeMode: (mode: ThemeMode) => void
  setColorMode: (mode: ColorMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')
  const [colorMode, setColorMode] = useState<ColorMode>('brand')

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedTheme = localStorage.getItem('themeMode') as ThemeMode | null
    const storedColor = localStorage.getItem('colorMode') as ColorMode | null
    if (storedTheme && THEME_MODES.includes(storedTheme)) setThemeMode(storedTheme)
    if (storedColor && COLOR_MODES.includes(storedColor)) setColorMode(storedColor)
  }, [])

  // Apply theme mode
  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.classList.remove('light', 'dark')
    if (themeMode === 'light') document.documentElement.classList.add('light')
    else if (themeMode === 'dark') document.documentElement.classList.add('dark')
    // For auto, remove both and let system decide
    localStorage.setItem('themeMode', themeMode)
  }, [themeMode])

  // Apply theme-color meta tag for PWA notch area
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let color = '#F8F6F4'; // Default to light mode color
    if (themeMode === 'dark') {
      color = '#1A1A1A';
    } else if (themeMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      color = prefersDark ? '#1A1A1A' : '#F8F6F4';
    }

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
  }, [themeMode]);

  // Apply color mode
  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.classList.remove('gray')
    if (colorMode === 'gray') document.documentElement.classList.add('gray')
    localStorage.setItem('colorMode', colorMode)
  }, [colorMode])

  return (
    <ThemeContext.Provider value={{ themeMode, colorMode, setThemeMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 