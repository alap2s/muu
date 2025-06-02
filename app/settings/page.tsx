'use client'
import { Button } from '../design-system/components/Button'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, BellOff, BellRing, Sun, SunMoon, Moon, Grid2x2, Rows3, Mail, Share, Euro, DollarSign, CircleOff, Circle, Printer, BookPlus } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useViewMode } from '../contexts/ViewModeContext'
import { useCurrency } from '../context/CurrencyContext'
import { useFont } from '../context/FontContext'
import { useRouter } from 'next/navigation'
import { useLoading } from '../contexts/LoadingContext'

// Define theme and color mode options
const THEME_MODES = ['auto', 'light', 'dark'] as const;
type ThemeMode = typeof THEME_MODES[number];
const COLOR_MODES = ['brand', 'gray'] as const;
type ColorMode = typeof COLOR_MODES[number];

export default function SettingsPage() {
  const { themeMode, colorMode, setThemeMode, setColorMode } = useTheme();
  const { viewMode, setViewMode } = useViewMode()
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { font, setFont } = useFont();
  const router = useRouter();
  const { setIsLoading } = useLoading()

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MUU',
          text: 'Accessible and personalized menus – check out MUU!',
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // fallback: copy to clipboard or show a message
      alert('Sharing is not supported on this device.')
    }
  }

  const handleEmail = () => {
    window.location.href = 'mailto:alapshah.com@gmail.com?subject=MUU%20Feedback'
  }

  const handlePrint = () => {
    window.location.href = '/?print=1'
  }

  // Row 1: BellOff (selected), BellRing (disabled), [gap], SunMoon (auto), Sun (light), Moon (dark)
  const buttonGrid = [
    [
      { icon: <CircleOff />, selected: colorMode === 'gray', onClick: () => setColorMode('gray'), label: 'Color Off' },
      { icon: <Circle fill="currentColor" />, selected: colorMode === 'brand', onClick: () => setColorMode('brand'), label: 'Color On' },
      null,
      { icon: <SunMoon />, selected: themeMode === 'auto', onClick: () => setThemeMode('auto'), label: 'Auto Theme' },
      { icon: <Sun />, selected: themeMode === 'light', onClick: () => setThemeMode('light'), label: 'Light Theme' },
      { icon: <Moon />, selected: themeMode === 'dark', onClick: () => setThemeMode('dark'), label: 'Dark Theme' },
    ],
    // Row 2: Layout, View
    [
      { icon: <Grid2x2 />, selected: viewMode === 'grid', onClick: () => setViewMode('grid'), label: 'Grid View' },
      { icon: <Rows3 />, selected: viewMode === 'list', onClick: () => setViewMode('list'), label: 'List View' }
    ],
    // Row 3: Language and Currency
    [
      { icon: <span className="font-mono">EN</span>, selected: true, onClick: () => {}, label: 'English' },
      { icon: <span className="font-mono">DE</span>, selected: false, disabled: true, onClick: undefined, label: 'German' },
      null,
      { icon: <Euro />, selected: selectedCurrency === 'EUR', onClick: () => setSelectedCurrency('EUR'), label: 'Euro' },
      { icon: <DollarSign />, selected: selectedCurrency === 'USD', onClick: () => setSelectedCurrency('USD'), label: 'Dollar' }
    ],
    // Row 4: Print, Email, Share
    [
      { icon: <BookPlus />, selected: false, onClick: () => window.location.href = '/menu-request', label: 'Request Menu' },
      { icon: <Printer />, selected: false, onClick: handlePrint, label: 'Print' },
      null,
      { icon: <Mail />, selected: false, onClick: handleEmail, label: 'Mail' },
      { icon: <Share />, selected: false, onClick: handleShare, label: 'Share' }
    ]
  ];

  // Define the type for button grid row
  interface ButtonGridItem {
    icon: React.ReactNode;
    selected: boolean;
    disabled?: boolean;
    onClick?: () => void;
    label: string;
  }

  function renderButtonRow(row: (ButtonGridItem | null)[]) {
    return (
      <div className="flex w-full h-full items-center">
        {row.map((content: ButtonGridItem | null, j: number) => {
          if (content === null) {
            // For null values, render a flexible spacer
            return <div key={j} className="flex-1 h-12" />;
          }
          // Render button
          return (
            <div key={j} className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <Button
                variant="secondary"
                selected={content.selected}
                disabled={content.disabled}
                onClick={content.onClick}
                className="w-12 h-12 p-0 flex items-center justify-center"
                aria-label={content.label}
                aria-pressed={content.selected}
                aria-disabled={content.disabled}
              >
                {content.icon}
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  // 48px per row, fill at least 24 rows to cover most screens
  const rowCount = 24;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      {/* Status announcements for screen readers */}
      <div aria-live="polite" className="sr-only">
        {themeMode === 'light' ? 'Light theme enabled' :
         themeMode === 'dark' ? 'Dark theme enabled' :
         themeMode === 'auto' ? 'System theme enabled' : ''}
      </div>

      {/* Notch spacer row for safe area */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      {/* Header */}
      <header className="flex justify-center" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
        <div style={{ flex: 1, maxWidth: 1024, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)', paddingRight: 0 }}>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Settings</h1>
          </div>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
      </header>

      {/* Content */}
      <div className="space-y-0" style={{ height: 'calc(100vh - 48px - env(safe-area-inset-top))', overflowY: 'auto' }} role="region" aria-label="Settings options">
        {[...Array(rowCount)].map((_, i) => (
          <div key={i} className="flex justify-center">
            <div
              style={{
                width: 32,
                height: i === 1 ? 'auto' : 48,
                borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                borderBottom: '1px solid var(--border-main)',
                background: 'var(--background-main)'
              }}
            />
            <div style={{ flex: 1, maxWidth: 1024, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', height: i === 1 ? 'auto' : 48, position: 'relative' }}>
              {i === 1 && (
                <div className="flex flex-col w-full px-3" style={{ paddingTop: 12, paddingBottom: 12 }}>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: '18px', marginBottom: 4 }}>MUU</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }}>
                    A smart, accessible menu app that automatically shows you the restaurant's menu where you're seated. Designed with accessibility in mind, it offers easy-to-read fonts, dark and light modes, currency support, and simple layouts. Restaurants can print personalized, standardized menus, with support for multiple languages coming soon.
                  </span>
                </div>
              )}
              {/* 3rd row (index 2) intentionally left empty */}
              {i >= 3 && i < 7 && renderButtonRow(buttonGrid[i-3])}
              {/* 5th row (index 4): font toggle buttons directly after center content */}
              {i === 4 && (
                <>
                  <Button
                    variant="secondary"
                    selected={font === 'jetbrains'}
                    onClick={() => setFont('jetbrains')}
                    className="w-12 h-12 p-0 flex items-center justify-center rounded-none border-r-0"
                    aria-label="Use JetBrains Mono font"
                    aria-pressed={font === 'jetbrains'}
                  >
                    <span className="font-mono text-[14px]" aria-hidden="true">JT</span>
                  </Button>
                  <Button
                    variant="secondary"
                    selected={font === 'atkinson'}
                    onClick={() => setFont('atkinson')}
                    className="w-12 h-12 p-0 flex items-center justify-center rounded-none"
                    aria-label="Use Atkinson Hyperlegible font"
                    aria-pressed={font === 'atkinson'}
                  >
                    <span className="font-mono text-[14px]" aria-hidden="true">AT</span>
                  </Button>
                </>
              )}
            </div>
            <div
              style={{
                width: 32,
                height: i === 1 ? 'auto' : 48,
                borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
                borderBottom: '1px solid var(--border-main)',
                background: 'var(--background-main)'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 