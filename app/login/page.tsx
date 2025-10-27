'use client'
import { Button } from '../design-system/components/Button'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, LogIn } from 'lucide-react'
import { useViewMode } from '../contexts/ViewModeContext'
import { useRouter } from 'next/navigation'
import { useLoading } from '../contexts/LoadingContext'
import { auth } from '../../lib/firebase'
import { GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { viewMode } = useViewMode()
  const router = useRouter()
  const { setIsLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [redirectTo, setRedirectTo] = useState<string>('/')
  const { currentUser } = useAuth()
  const [redirectHandled, setRedirectHandled] = useState(false)
  // Remove auto-retry state to avoid redirect loops

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading])

  // One-time debug: confirm Firebase config and env are what we expect
  useEffect(() => {
    try {
      console.log('[Debug] Firebase app options', auth.app.options)
      console.log('[Debug] Env', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')
      if (next) setRedirectTo(next)
    }
  }, [])

  // Auto-redirect disabled to prevent loops; user must click the button

  // Handle redirect sign-in result (for mobile or popup fallback)
  useEffect(() => {
    let cancelled = false
    const computePostLoginPath = async (proposed: string, uid?: string | null) => {
      try {
        if (!uid) return proposed || '/'
        const url = new URL('/api/lists', window.location.origin)
        if (proposed?.startsWith('/lists/create')) {
          url.searchParams.set('ownerUid', uid)
          const resp = await fetch(url.toString())
          if (resp.ok) {
            const data = await resp.json()
            const firstId = data?.lists?.[0]?.id as string | undefined
            if (firstId) return `/lists/create?id=${firstId}`
          }
        }
      } catch {}
      return proposed || '/'
    }
    const handle = async () => {
      try {
        console.log('[Login] getRedirectResult: start')
        const result = await getRedirectResult(auth)
        if (cancelled) return
        console.log('[Login] getRedirectResult: result', !!result, !!result?.user)
        if (result?.user) {
          try {
            console.log('[Login] Upserting user after redirect')
            const idToken = await result.user.getIdToken()
            await fetch('/api/user/upsert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
              body: JSON.stringify({
                uid: result.user.uid,
                displayName: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
              }),
            })
          } catch (e) {
            console.error('Upsert failed after redirect', e)
          }
          setRedirectHandled(true)
          const target = await computePostLoginPath(redirectTo || '/', result.user.uid)
          console.log('[Login] Redirecting to', target)
          try { sessionStorage.removeItem('loginAttempted') } catch {}
          router.replace(target)
        } else {
          // If no redirect result but already signed in, the other effect will handle redirect
          console.log('[Login] No redirect result user')
          // Do nothing here; rely on onAuthStateChanged to handle redirect once state settles
        }
      } catch (e: any) {
        console.error('Redirect result error', e)
        setError(e?.message || 'Login failed. Please try again.')
      }
    }
    handle()
    return () => { cancelled = true }
  }, [redirectTo, router])

  // If already signed in (e.g., returning from redirect and state is ready), go to next
  useEffect(() => {
    if (!currentUser || redirectHandled) return
    console.log('[Login] currentUser detected, redirecting...', currentUser.uid)
    const doRedirect = async () => {
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
          })
          })
      } catch {}
      setRedirectHandled(true)
      try {
        const url = new URL('/api/lists', window.location.origin)
        if (redirectTo?.startsWith('/lists/create')) {
          url.searchParams.set('ownerUid', currentUser.uid)
          const resp = await fetch(url.toString())
          if (resp.ok) {
            const data = await resp.json()
            const firstId = data?.lists?.[0]?.id as string | undefined
            if (firstId) {
              router.replace(`/lists/create?id=${firstId}`)
              return
            }
          }
        }
      } catch {}
      router.replace(redirectTo || '/')
    }
    void doRedirect()
  }, [currentUser, redirectHandled, redirectTo, router])

  const handleGoogleLogin = async () => {
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      if (host === 'localhost' || host === '127.0.0.1') {
        console.log('[Login] Click: using popup on localhost')
        await signInWithPopup(auth, provider)
        console.log('[Login] signInWithPopup resolved')
        // onAuthStateChanged will handle redirect to next
      } else {
        console.log('[Login] Click: starting Google redirect')
        await signInWithRedirect(auth, provider)
        console.log('[Login] signInWithRedirect called')
      }
    } catch (error: any) {
      const errorMessage = error?.message
      console.error('[Login] signInWithRedirect error', error)
      setError(errorMessage || 'Login failed. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      {/* Notch spacer row for safe area */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      {/* Header */}
      <header className="flex justify-center" style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, background: 'var(--background-main)', paddingRight: 0 }}>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Login</h1>
          </div>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
      </header>

      {/* Content */}
      <div className="space-y-0" style={{ height: 'calc(100vh - 48px - env(safe-area-inset-top))', overflowY: 'auto' }} role="region" aria-label="Login options">
        
        {/* Empty Row */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, height: 48 }} />
          <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>

        {/* Info Row */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, padding: '24px 16px' }}>
            <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: '18px', marginBottom: 4 }}>Why Login?</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }}>
              Logging in allows you to create your own restaurant collections, follow collections from others, and mark your favorite restaurants.
            </p>
          </div>
          <div style={{ width: 32, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
        
        {/* Login Button Row */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', height: 48, position: 'relative', padding: '0 0px' }}>
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
          <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>

        {/* Error Row under the login button row */}
        {error && (
          <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 16px' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</span>
            </div>
            <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          </div>
        )}

        {/* Empty Row */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, height: 48 }} />
          <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
        
        {/* Filler rows to push content up */}
        {[...Array(10)].map((_, i) => (
            <div key={`filler-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, height: 48 }} />
              <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
        ))}
      </div>
    </div>
  )
}
