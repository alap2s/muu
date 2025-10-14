import './globals.css'
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { ViewModeProvider } from './contexts/ViewModeContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { FontInitializer } from './components/FontInitializer'
import { FontProvider } from './context/FontContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { ClientLayout } from './components/ClientLayout'
import { AuthProvider } from './context/AuthContext'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: false
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  applicationName: 'MUU',
  title: 'MUU',
  description: 'Standardized, accessible restaurant menus that remember your preferences.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MUU',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://muu.app',
    title: 'MUU',
    description: 'Standardized, accessible restaurant menus that remember your preferences.',
    siteName: 'MUU',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MUU Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'MUU',
    description: 'Standardized, accessible restaurant menus that remember your preferences.',
    images: ['/icon-512.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning className={`bg-background-secondary dark:bg-dark-background-main text-black dark:text-dark-text-primary`} style={{ fontFamily: 'var(--font-main)' }}>
        <FontProvider>
          <FontInitializer />
          <CurrencyProvider>
            <ThemeProvider>
              <ViewModeProvider>
                <LoadingProvider>
                  <AuthProvider>
                    <ClientLayout>
                      <Toaster position="bottom-center" />
                      {children}
                    </ClientLayout>
                  </AuthProvider>
                </LoadingProvider>
              </ViewModeProvider>
            </ThemeProvider>
          </CurrencyProvider>
        </FontProvider>
      </body>
    </html>
  )
} 