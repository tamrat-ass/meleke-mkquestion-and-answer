import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '../styles/globals.css'
import { LanguageProvider } from '@/lib/i18n/context'

// Build version 4 - Complete rebuild required
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuizMaster - Q&A Game Platform',
  description: 'A comprehensive Q&A game platform with admin dashboard, teacher tools, and real-time gameplay',
  generator: 'tame.app',
}

export const viewport: Viewport = {
  themeColor: '#1a4d4d',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
