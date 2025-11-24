'use client'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { useViewMode } from '../contexts/ViewModeContext'
import { useRouter } from 'next/navigation'
import { useLoading } from '../contexts/LoadingContext'
import { GridRow } from '../design-system/components/GridRow'
import { Header as DSHeader } from '../design-system/components/Header'
import { PageShell } from '../design-system/components/PageShell'
import { PageContentStack } from '../design-system/components/PageContentStack'
import { auth } from '../../lib/firebase'
import { GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
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
  const [email, setEmail] = useState('')
  const [emailLinkSending, setEmailLinkSending] = useState(false)
  const [emailLinkSent, setEmailLinkSent] = useState(false)
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

  // Handle email-link completion
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const completeEmailLink = async () => {
      try {
        const href = window.location.href
        if (!isSignInWithEmailLink(auth, href)) return
        let emailForSignIn: string | null = null
        try { emailForSignIn = window.localStorage.getItem('emailForSignIn') } catch {}
        if (!emailForSignIn) {
          // As a fallback, ask user for email if not available
          emailForSignIn = window.prompt('Please confirm your email for sign-in') || ''
        }
        if (!emailForSignIn) return
        const result = await signInWithEmailLink(auth, emailForSignIn, href)
        if (cancelled) return
        try { window.localStorage.removeItem('emailForSignIn') } catch {}
        // Upsert basic user info
        try {
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
        } catch {}
        // Compute redirect
        const target = redirectTo || '/'
        router.replace(target)
      } catch (e: any) {
        console.error('Email link completion error', e)
        setError(e?.message || 'Sign-in link is invalid or expired.')
      }
    }
    void completeEmailLink()
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
      try { sessionStorage.setItem('loginAttempted', '1') } catch {}
      console.log('[Login] Click: trying popup first')
      await signInWithPopup(auth, provider)
      console.log('[Login] signInWithPopup resolved')
      // onAuthStateChanged will handle redirect to next
    } catch (error: any) {
      const code = error?.code || ''
      console.warn('[Login] Popup sign-in failed, falling back to redirect', code)
      try {
        await signInWithRedirect(auth, provider)
        console.log('[Login] signInWithRedirect called')
      } catch (e: any) {
        console.error('[Login] signInWithRedirect error', e)
        const errorMessage = e?.message
        setError(errorMessage || 'Login failed. Please try again.')
      }
    }
  }

  const handleEmailLinkLogin = async () => {
    setError(null)
    setEmailLinkSent(false)
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    try {
      setEmailLinkSending(true)
      const continueUrl = (typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : '/login')
      const actionCodeSettings = {
        url: process.env.NEXT_PUBLIC_EMAIL_LINK_CONTINUE_URL || continueUrl,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      try { window.localStorage.setItem('emailForSignIn', email) } catch {}
      setEmailLinkSent(true)
    } catch (e: any) {
      console.error('sendSignInLinkToEmail error', e)
      setError(e?.message || 'Failed to send sign-in link. Please try again.')
    } finally {
      setEmailLinkSending(false)
    }
  }

  return (
    <PageShell
      header={
        <DSHeader
          showRails={viewMode === 'grid'}
          borderBottom={false}
          left={
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          }
          center={
            <div style={{ width: '100%', display: 'flex', justifyContent: 'left', padding: '0 16px' }}>
              <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>Login</h1>
            </div>
          }
        />
      }
    >
      <PageContentStack className="space-y-0" role="region" aria-label="Login options" autoPad>
        
        {/* Empty Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, height: 48 }} />
        </GridRow>

        {/* Info Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, maxWidth: 800, padding: '24px 16px' }}>
            <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: '18px', marginBottom: 4 }}>Why Login?</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }}>
              Logging in allows you to create your own restaurant collections, follow collections from others, and mark your favorite restaurants.
            </p>
          </div>
        </GridRow>
        
        {/* Login Button Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <Button
              variant="secondary"
              onClick={handleGoogleLogin}
              className="w-full justify-start"
              aria-label="Login with Google"
            >
              <img src="/google-g.svg" alt="" aria-hidden="true" />
              Login with Google
            </Button>
        </GridRow>

        {/* Error Row under the login button row */}
        {error && (
          <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 16px' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</span>
        </div>
          </GridRow>
        )}

        {/* Empty Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, height: 48 }} />
        </GridRow>

        {/* Email Input Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailLinkSent) setEmailLinkSent(false)
              }}
              placeholder="Enter your email"
              aria-label="Email address"
            />
        </GridRow>

        {/* Login with Email Button Row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <Button
              variant="secondary"
              onClick={handleEmailLinkLogin}
              className="w-full justify-start"
              aria-label="Login with email"
              disabled={emailLinkSending}
            >
              <Mail />
              {emailLinkSending ? 'Sending link…' : 'Login with email'}
            </Button>
        </GridRow>

        {/* Email link sent confirmation Row */}
        {emailLinkSent && (
          <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48, padding: '16px' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Magic link sent to {email}. Check Spam if it’s hiding.
              </span>
            </div>
          </GridRow>
        )}
        
      </PageContentStack>
    </PageShell>
  )
}
