'use client'

import { useState, useEffect } from 'react'
import { Button } from '../design-system/components/Button'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

const isStandalone = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as NavigatorWithStandalone).standalone
}

const isIosDevice = () => {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
}

const isAndroidDevice = () => {
  if (typeof window === 'undefined') return false
  return /android/.test(window.navigator.userAgent.toLowerCase())
}

export function A2HSBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const ios = isIosDevice()
    const android = isAndroidDevice()
    setIsIos(ios)
    setIsAndroid(android)

    // Only show banner if not already shown in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('a2hsBannerShown')) {
      return
    }

    // Handle Android installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
      sessionStorage.setItem('a2hsBannerShown', '1')
    }

    let timer: NodeJS.Timeout | null = null
    if (android) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    } else if (ios) {
      timer = setTimeout(() => {
        if (!isStandalone()) {
          setShowBanner(true)
          sessionStorage.setItem('a2hsBannerShown', '1')
        }
      }, 15000)
    }

    return () => {
      if (android) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
      if (timer) clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (!showBanner) return null

  return (
    <>
      <div className="fixed inset-0 z-[99]" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.08)' }} />
      <div className="fixed bottom-[80px] left-0 right-0 z-[100] flex justify-center" style={{ background: 'transparent' }}>
        <div className="max-w-4xl w-full px-4">
          <div className="shadow-lg" style={{ border: '1px solid var(--border-main)', background: 'var(--background-main)' }}>
            <div className="flex items-center justify-between" style={{ height: 48, borderBottom: '1px solid var(--border-main)' }}>
              <p className="text-sm px-4" style={{ color: 'var(--text-primary)' }}>
                {isIos ? 'Use like an app' : isAndroid ? 'Install Menoo' : 'Add to Home Screen'}
              </p>
              <button
                onClick={() => setShowBanner(false)}
                className="h-12 w-12 flex items-center justify-center text-[var(--accent)] border-0 border-l border-border bg-transparent"
                aria-label="Dismiss"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="p-4 pb-6">
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {isIos ? (
                  <>
                    1. Tap the Share button
                    <br />
                    2. Tap "Add to Home Screen"
                  </>
                ) : isAndroid ? (
                  'Install Menoo for better experience'
                ) : (
                  'Add this app to your home screen for the best experience'
                )}
              </p>
            </div>
            {isAndroid && (
              <div className="flex items-center justify-end p-4 pt-3" style={{ borderTop: '1px solid var(--border-main)' }}>
                <button
                  onClick={handleInstall}
                  style={{ background: 'var(--accent)', color: 'var(--background-main)', borderRadius: 8, fontWeight: 500, fontSize: 14, padding: '8px 16px' }}
                >
                  Install
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 