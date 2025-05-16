import './globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: false
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Menoo',
  description: 'Find nearby restaurants and their menus',
  icons: {
    icon: '/favicon.svg',
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
      </head>
      <body suppressHydrationWarning className={`${jetbrainsMono.className} bg-background-secondary dark:bg-dark-background-main text-black dark:text-dark-text-primary`}>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
} 