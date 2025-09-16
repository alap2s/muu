'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Button } from '../design-system/components/Button'
import { ArrowLeft } from 'lucide-react'
import { useViewMode } from '../contexts/ViewModeContext'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { viewMode } = useViewMode()

  useEffect(() => {
    if (user) {
      router.replace('/')
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800 }} />
        <div style={{ width: 32 }} />
      </div>

      <header className="flex justify-center" style={{ position: 'sticky', top: 'env(safe-area-inset-top)', zIndex: 10, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <Button variant="secondary" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Login</h1>
          <div style={{ width: 48 }} /> {/* Spacer to balance the header */}
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
      </header>

      <main>
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, padding: '24px 16px' }}>
            <div className="text-left">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Create an Account</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Create an account to unlock the full experience. You'll be able to:
              </p>
              <ul className="mt-4 text-sm text-left" style={{ color: 'var(--text-secondary)' }}>
                <li className="flex items-center gap-2">✓ Create your own curated restaurant lists.</li>
                <li className="flex items-center gap-2">✓ Follow lists created by others.</li>
                <li className="flex items-center gap-2">✓ Mark your favorite restaurants for easy access.</li>
              </ul>
            </div>
          </div>
          <div style={{ width: 32, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
          <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', height: 48 }}>
            <Button
              variant="primary"
              onClick={handleGoogleSignIn}
              className="w-full justify-center"
            >
              Login with Google
            </Button>
          </div>
          <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
        </div>

        {/* Filler rows */}
        {[...Array(24)].map((_, i) => (
            <div key={`filler-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
              <div style={{ flex: 1, maxWidth: 800, height: 48 }} />
              <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none' }} />
            </div>
        ))}
      </main>
    </div>
  )
}
