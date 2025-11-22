'use client'

import { useState } from 'react'
import { Store, MapPin, Globe, Send, ArrowLeft } from 'lucide-react'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { useViewMode } from '../contexts/ViewModeContext'
import { useRouter } from 'next/navigation'

export default function MenuRequest() {
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [restaurantWebsite, setRestaurantWebsite] = useState('')
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const { viewMode } = useViewMode()
  const router = useRouter()

  const handleSubmit = () => {
    if (!restaurantName || !restaurantAddress) {
      setFormStatus('error')
      return
    }

    setFormStatus('submitting')
    const subject = `New Restaurant Request: ${restaurantName}`
    const body = `Restaurant Name: ${restaurantName}\nRestaurant Address: ${restaurantAddress}\nRestaurant Website: ${restaurantWebsite}`
    
    window.location.href = `mailto:alapshah.com@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setFormStatus('success')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      {/* Status announcements for screen readers */}
      <div aria-live="polite" className="sr-only">
        {formStatus === 'error' ? 'Please fill in all required fields' :
         formStatus === 'submitting' ? 'Preparing to send request...' :
         formStatus === 'success' ? 'Request sent successfully' : ''}
      </div>

      {/* Notch spacer row for safe area */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      {/* Header */}
      <header className="flex justify-center" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none', borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
        <div style={{ flex: 1, maxWidth: 1024, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)', paddingRight: 0 }}>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Request Menu</h1>
          </div>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none', borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
      </header>

      {/* Content */}
      <div className="space-y-0" style={{ height: 'calc(100vh - 48px - env(safe-area-inset-top))', overflowY: 'auto' }} role="region" aria-label="Menu request form">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="flex justify-center">
            <div
              style={{
                width: 32,
                height: i >= 1 && i <= 8 ? 'auto' : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
                borderRight: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none',
                borderBottom: 'var(--border-hairline-solid)',
                background: 'var(--background-main)'
              }}
              role="presentation"
            />
            <div style={{ flex: 1, maxWidth: 1024, borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', height: i >= 1 && i <= 8 ? 48 : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)', position: 'relative' }}>
              {i === 1 && (
                <div className="flex flex-col w-full px-3">
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>Request a new restaurant menu</p>
                </div>
              )}
              {i === 2 && (
                <div className="flex flex-col w-full">
                  <Input
                    type="text"
                    placeholder="Restaurant name"
                    icon={Store}
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    aria-label="Restaurant name"
                    required
                    aria-invalid={formStatus === 'error' && !restaurantName}
                  />
                </div>
              )}
              {i === 3 && (
                <div className="flex flex-col w-full">
                  <Input
                    type="text"
                    placeholder="Restaurant address"
                    icon={MapPin}
                    value={restaurantAddress}
                    onChange={(e) => setRestaurantAddress(e.target.value)}
                    aria-label="Restaurant address"
                    required
                    aria-invalid={formStatus === 'error' && !restaurantAddress}
                  />
                </div>
              )}
              {i === 4 && (
                <div className="flex flex-col w-full">
                  <Input
                    type="url"
                    placeholder="Restaurant website (optional)"
                    icon={Globe}
                    value={restaurantWebsite}
                    onChange={(e) => setRestaurantWebsite(e.target.value)}
                    aria-label="Restaurant website (optional)"
                  />
                </div>
              )}
              {i === 5 && (
                <div className="flex flex-col w-full">
                  <Button
                    variant="secondary"
                    onClick={handleSubmit}
                    aria-label="Send restaurant request"
                    aria-busy={formStatus === 'submitting'}
                  >
                    Send request
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
            <div
              style={{
                width: 32,
                height: i >= 1 && i <= 8 ? 'auto' : 'calc((100vh - 48px - env(safe-area-inset-top)) / 16)',
                borderLeft: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none',
                borderBottom: 'var(--border-hairline-solid)',
                background: 'var(--background-main)'
              }}
              role="presentation"
            />
          </div>
        ))}
      </div>
    </div>
  )
} 