import './globals.css'
import type { Metadata } from 'next'
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

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: false
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MUU',
  description: 'Find and explore restaurant menus nearby.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MUU',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#ffffff',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://muu.app',
    title: 'MUU',
    description: 'Find and explore restaurant menus nearby.',
    siteName: 'MUU',
  },
  twitter: {
    card: 'summary',
    title: 'MUU',
    description: 'Find and explore restaurant menus nearby.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#6237FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MUU" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MUU" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta property="og:title" content="MUU" />
        <meta property="og:description" content="Accessible and personalized menus" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:url" content="https://muu.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUU" />
        <meta name="twitter:description" content="Accessible and personalized menus" />
        <meta name="twitter:image" content="/icon-512.png" />
      </head>
      <body suppressHydrationWarning className={`bg-background-secondary dark:bg-dark-background-main text-black dark:text-dark-text-primary`} style={{ fontFamily: 'var(--font-main)' }}>
        <FontProvider>
          <FontInitializer />
          <CurrencyProvider>
            <ThemeProvider>
              <ViewModeProvider>
                <LoadingProvider>
                  <ClientLayout>
                    <Toaster position="bottom-center" />
                    {children}
                  </ClientLayout>
                </LoadingProvider>
              </ViewModeProvider>
            </ThemeProvider>
          </CurrencyProvider>
        </FontProvider>
      </body>
    </html>
  )
} 