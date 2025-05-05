import './globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

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
        <meta name="theme-color" content="#E34114" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Menoo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${jetbrainsMono.className} bg-[#F8F6F4] dark:bg-[#181818] text-[#1e1e1e] dark:text-[#F8F6F4]`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
} 