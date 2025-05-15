'use client'

import { useState, useEffect } from 'react'

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

    // Handle Android installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    if (android) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    } else if (ios) {
      setShowBanner(!isStandalone())
    }

    return () => {
      if (android) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
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
    <div className="fixed bottom-[80px] left-0 right-0 bg-primary-light dark:bg-dark-background-main z-[100]">
      <div className="max-w-4xl mx-auto">
        <div className="border-t border-primary-border/10 dark:border-dark-primary-border/20">
          <div className="flex w-full border-b border-primary-border/10 dark:border-dark-primary-border/20">
            <div className="w-8 flex-none border-r border-primary-border/40 dark:border-dark-primary-border/40 bg-primary-light dark:bg-dark-background-main" />
            <div className="flex-1 flex flex-col min-w-0 p-4 border-l border-r border-t border-b border-primary-border/40 dark:border-dark-primary-border/40">
              <div className="flex-1 min-w-0 mb-4">
                <p className="text-sm text-black dark:text-dark-text-primary">
                  {isIos ? (
                    <>
                      To install this app on your iPhone:
                      <br />
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
              <div className="flex items-center justify-end">
                {isAndroid && (
                  <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90"
                  >
                    Install
                  </button>
                )}
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-primary dark:text-dark-text-primary text-sm font-medium ml-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div className="w-8 flex-none bg-primary-light dark:bg-dark-background-main" />
          </div>
        </div>
      </div>
    </div>
  )
} 