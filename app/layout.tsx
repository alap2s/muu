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
  title: 'Restaurant Menu Finder',
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
      <body className={`${jetbrainsMono.className} bg-[#F8F6F4] dark:bg-[#181818] text-[#1e1e1e] dark:text-[#F8F6F4]`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
} 