import { useEffect, useState } from 'react'

function isIos() {
  return (
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !window.navigator.standalone
  )
}

function isInStandaloneMode() {
  // @ts-ignore
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
}

export function A2HSBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const installed = isInStandaloneMode()
      setIsInstalled(installed)
      if (installed) {
        setShowBanner(false)
      }
    }

    // Initial check
    checkIfInstalled()

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = () => {
      checkIfInstalled()
    }
    mediaQuery.addEventListener('change', handleChange)

    let timeoutId: NodeJS.Timeout

    // Android: Listen for beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Set a 10-second delay before showing the banner
      timeoutId = setTimeout(() => {
        if (!isInstalled) {
          setShowBanner(true)
        }
      }, 10000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS: Detect Safari
    if (isIos() && !isInstalled) {
      setIsIosDevice(true)
      // Set a 10-second delay before showing the banner
      timeoutId = setTimeout(() => {
        if (!isInstalled) {
          setShowBanner(true)
        }
      }, 10000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      mediaQuery.removeEventListener('change', handleChange)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isInstalled])

  if (!showBanner || isInstalled) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[9999] flex justify-center md:hidden">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center">
          <div className="w-8 border-r border-primary-border/40 dark:border-dark-primary-border/40 bg-primary-light dark:bg-dark-background-main" />
          <div className="flex-1 border-r border-primary-border/40 dark:border-dark-primary-border/40 bg-primary-light dark:bg-dark-background-main">
            <div className="flex flex-col p-4 border-t border-b border-primary-border/40 dark:border-dark-primary-border/40">
              <div className="text-sm text-[#1e1e1e] dark:text-dark-text-primary mb-3">
                {isIosDevice ? (
                  'Add Menoo to your home screen: Tap Share then Add to Home Screen'
                ) : (
                  'Install Menoo for a better experience.'
                )}
              </div>
              <div className="flex justify-between items-center">
                {!isIosDevice && (
                  <button
                    className="px-3 py-1 bg-primary text-white text-xs font-bold hover:bg-primary/80"
                    onClick={async () => {
                      if (deferredPrompt) {
                        deferredPrompt.prompt()
                        setShowBanner(false)
                      }
                    }}
                  >
                    Add to Home Screen
                  </button>
                )}
                <button
                  className="text-[#1e1e1e]/50 dark:text-dark-text-primary/70 text-xs font-medium"
                  onClick={() => setShowBanner(false)}
                  aria-label="Dismiss"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <div className="w-8 bg-primary-light dark:bg-dark-background-main" />
        </div>
      </div>
    </div>
  )
} 