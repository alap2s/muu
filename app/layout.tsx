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
        <meta name="theme-color" content="#6237FF" id="theme-color-meta" />
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/atkinson-hyperlegible" />
        <script dangerouslySetInnerHTML={{
          __html: `
            function setThemeColor() {
              var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
              var meta = document.getElementById('theme-color-meta');
              if (meta && accent) meta.setAttribute('content', accent);
            }
            setThemeColor();
            window.addEventListener('DOMContentLoaded', setThemeColor);
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setThemeColor);
            var observer = new MutationObserver(setThemeColor);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
          `
        }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Menoo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta property="og:title" content="Menoo" />
        <meta property="og:description" content="Accessible and personalized menus" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:url" content="https://menoo.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Menoo" />
        <meta name="twitter:description" content="Accessible and personalized menus" />
        <meta name="twitter:image" content="/icon-512.png" />
      </head>
      <body suppressHydrationWarning className={`bg-background-secondary dark:bg-dark-background-main text-black dark:text-dark-text-primary`} style={{ fontFamily: 'var(--font-main)' }}>
        <FontProvider>
          <FontInitializer />
          <CurrencyProvider>
            <ThemeProvider>
              <ViewModeProvider>
                {children}
              </ViewModeProvider>
            </ThemeProvider>
            <Toaster position="bottom-center" />
          </CurrencyProvider>
        </FontProvider>
      </body>
    </html>
  )
} 