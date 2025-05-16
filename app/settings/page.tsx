'use client'
import { Button } from '../design-system/components/Button'
import Link from 'next/link'
import React from 'react'
import { ArrowLeft, BellOff, BellRing, Sun, SunMoon, Moon, Grid2x2, Rows3, Mail, Share, Euro, DollarSign, CircleOff, Circle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Define theme and color mode options
const THEME_MODES = ['auto', 'light', 'dark'] as const;
type ThemeMode = typeof THEME_MODES[number];
const COLOR_MODES = ['brand', 'gray'] as const;
type ColorMode = typeof COLOR_MODES[number];

export default function SettingsPage() {
  const { themeMode, colorMode, setThemeMode, setColorMode } = useTheme();

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
      { icon: <Grid2x2 />, selected: true, label: 'Grid View' },
      { icon: <Rows3 />, selected: false, label: 'List View' }
    ],
    // Row 3: Language, Share
    [
      { icon: <Mail />, selected: true, label: 'Email' },
      { icon: <Share />, selected: false, label: 'Share' },
      null,
      { icon: <Euro />, selected: true, label: 'Euro' },
      { icon: <DollarSign />, selected: false, label: 'Dollar' }
    ],
    // Row 4: Language
    [
      { icon: <span className="font-mono">EN</span>, selected: true, label: 'English' },
      { icon: <span className="font-mono">DE</span>, selected: true, label: 'German' },
      null,
      { icon: <Mail />, selected: false, label: 'Mail' },
      { icon: <Share />, selected: false, label: 'Share' }
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
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }}>
      {[...Array(rowCount)].map((_, i) => (
        <div key={i} className="flex justify-center">
          <div style={i === 2 ? { width: 32, height: 'auto', borderBottom: '1px solid var(--border-main)', borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' } : { width: 32, height: 48, borderBottom: '1px solid var(--border-main)', borderRight: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
          <div style={{ flex: 1, maxWidth: 1024, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', height: i === 2 ? 'auto' : 48 }}>
            {i === 0 && (
              <>
                <Link href="/">
                  <Button variant="secondary" className="mr-2">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <span className="font-mono font-bold" style={{ color: 'var(--accent)', fontSize: 18 }}>Settings</span>
              </>
            )}
            {i === 2 && (
              <div className="flex flex-col w-full px-3" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: '18px', marginBottom: 4 }}>Menoo</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                  Accessible and standardized restaurant menus that adapt to your dietary preferences and language. No need to touch sticky menus anymore. Get notified when you sit down and settle.
                </span>
              </div>
            )}
            {/* 4th row (index 3) intentionally left empty */}
            {i >= 4 && i < 8 && renderButtonRow(buttonGrid[i-4])}
          </div>
          <div style={i === 2 ? { width: 32, height: 'auto', borderBottom: '1px solid var(--border-main)', borderLeft: '1px solid var(--border-main)', background: 'var(--background-main)' } : { width: 32, height: 48, borderBottom: '1px solid var(--border-main)', borderLeft: '1px solid var(--border-main)', background: 'var(--background-main)' }} />
        </div>
      ))}
    </div>
  )
} 