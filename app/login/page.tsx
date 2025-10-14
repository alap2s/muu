'use client'
import { Button } from '../design-system/components/Button'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, LogIn } from 'lucide-react'
import { useViewMode } from '../contexts/ViewModeContext'
import { useRouter } from 'next/navigation'
import { useLoading } from '../contexts/LoadingContext'
import { auth } from '../../lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export default function LoginPage() {
  const { viewMode } = useViewMode()
  const router = useRouter()
  const { setIsLoading } = useLoading()

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading])

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential?.accessToken
      // The signed-in user info.
      const user = result.user
      console.log({ user, token })
      router.push('/') // Redirect to home page after login
    } catch (error: any) {
      // Handle Errors here.
      const errorCode = error.code
      const errorMessage = error.message
      // The email of the user's account used.
      const email = error.customData?.email
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ errorCode, errorMessage, email, credential })
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
