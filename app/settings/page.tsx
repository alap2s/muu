'use client'
import { Button } from '../design-system/components/Button'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, BellOff, BellRing, Sun, SunMoon, Moon, Grid2x2, Rows3, Mail, Share, Euro, DollarSign, CircleOff, Circle, Printer, BookPlus, Puzzle, LogOut, LogIn } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useViewMode } from '../contexts/ViewModeContext'
import { useCurrency } from '../context/CurrencyContext'
import { useFont } from '../context/FontContext'
import { useRouter } from 'next/navigation'
import { useLoading } from '../contexts/LoadingContext'
import { ListItem } from '../design-system/components/ListItem'
import { GridRow } from '../design-system/components/GridRow'
import { Header as DSHeader } from '../design-system/components/Header'
import { PageShell } from '../design-system/components/PageShell'
import { PageContentStack } from '../design-system/components/PageContentStack'
import { useAuth } from '../context/AuthContext'
import { signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth } from '../../lib/firebase'

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
  const { currentUser } = useAuth()
  const [upsertedUid, setUpsertedUid] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading])

  // Upsert user when signed in (covers redirect/mobile flow too)
  useEffect(() => {
    const doUpsert = async () => {
      if (!currentUser) return
      if (upsertedUid === currentUser.uid) return
      try {
        const idToken = await currentUser.getIdToken()
        await fetch('/api/user/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          }),
        })
        setUpsertedUid(currentUser.uid)
      } catch {
        // ignore
      }
    }
    void doUpsert()
  }, [currentUser, upsertedUid])

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      try { sessionStorage.setItem('loginAttempted', '1') } catch {}
      // popup-first everywhere, fallback to redirect
      const cred = await signInWithPopup(auth, provider)
      try {
        const idToken = await cred.user.getIdToken()
        await fetch('/api/user/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            uid: cred.user.uid,
            displayName: cred.user.displayName,
            email: cred.user.email,
            photoURL: cred.user.photoURL,
          }),
        })
        setUpsertedUid(cred.user.uid)
      } catch {}
    } catch (e) {
      try {
        await signInWithRedirect(auth, provider)
      } catch {
        // ignore for settings row
      }
    }
  }

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
    window.location.href = '/menu?print=1'
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
    // Row 2: Layout, View, and Font controls
    [
      { icon: <Grid2x2 />, selected: viewMode === 'grid', onClick: () => setViewMode('grid'), label: 'Grid View' },
      { icon: <Rows3 />, selected: viewMode === 'list', onClick: () => setViewMode('list'), label: 'List View' },
      null, // single flexible spacer between left and right clusters
      { icon: <span className="font-mono">JT</span>, selected: font === 'jetbrains', onClick: () => setFont('jetbrains'), label: 'JetBrains Font' },
      { icon: <span className="font-mono">AT</span>, selected: font === 'atkinson', onClick: () => setFont('atkinson'), label: 'Atkinson Font' }
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
    ],
    // New Row for Components link
    [
      { icon: <Puzzle className="w-5 h-5" />, selected: false, onClick: () => router.push('/components'), label: 'Components' },
      null // single flexible spacer
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
    return row.map((content: ButtonGridItem | null, j: number) => {
          if (content === null) {
            // For null values, render a flexible spacer
            return <div key={j} className="flex-1 h-12" />;
          }
      // Render button (each as a fixed 48px square cell)
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
    });
  }

  // 48px per row, fill at least 24 rows to cover most screens
  const rowCount = 24;
  return (
    <PageShell
      header={
        <DSHeader
          showRails={viewMode === 'grid'}
          borderBottom={true}
          left={
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          }
          center={
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '0 16px' }}>
              <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Settings</h1>
            </div>
          }
        />
      }
    >
      {/* Status announcements for screen readers */}
      <div aria-live="polite" className="sr-only">
        {themeMode === 'light' ? 'Light theme enabled' :
         themeMode === 'dark' ? 'Dark theme enabled' :
         themeMode === 'auto' ? 'System theme enabled' : ''}
      </div>

      {/* Content */}
      <PageContentStack className="space-y-0" role="region" aria-label="Settings options" autoPad>
        {/* Empty Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, height: 48 }} />
        </GridRow>

        {/* Settings Rows */}
        {buttonGrid.map((row, i) => (
          <GridRow key={`settings-row-${i}`} showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
              {renderButtonRow(row)}
          </GridRow>
        ))}
        
        {/* Empty Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, height: 48 }} />
        </GridRow>
        
        {/* Account / Logout Row (only when logged in) */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1 }}>
            {currentUser ? (
            <ListItem
                title={currentUser.displayName || 'Account'}
                subtitle={currentUser.email || ''}
                onClick={async () => {
                  try {
                    await signOut(auth)
                  } catch {}
                  router.push('/')
              }}
                endContent={<LogOut className="w-4 h-4" />}
              />
            ) : (
              <div className="flex items-center" style={{ height: 48 }}>
                <Button
                  variant="secondary"
                  onClick={handleGoogleLogin}
                  className="w-full justify-start"
                  aria-label="Login with Google"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login with Google
                </Button>
              </div>
            )}
          </div>
        </GridRow>

        {/* Empty Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, height: 48 }} />
        </GridRow>

        {/* MUU Info Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, maxWidth: 800, padding: '12px 16px' }}>
            <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: '18px', marginBottom: 4 }}>MUU</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }}>
              Crowdsourced best spots and lists in the town. It started as a standardized menu app and now doing much more.
            </p>
          </div>
        </GridRow>

        {/* Credit Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, maxWidth: 800, padding: '12px 16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              Designed and vibe coded by <a href="https://www.linkedin.com/in/shahalap/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent)' }}>@alap</a> in Berlin, Europe.
            </p>
          </div>
        </GridRow>

      </PageContentStack>
    </PageShell>
  )
} 