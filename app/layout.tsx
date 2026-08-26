import React from "react"
import type { Metadata, Viewport } from 'next'

import '../styles/globals.css'
import { LanguageProvider } from '@/lib/i18n/context'
import { ThemeProvider } from 'next-themes'

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
