import React from 'react'
import { Cormorant_Garamond, Manrope, JetBrains_Mono } from 'next/font/google'

import { Stardust } from './components/Stardust'
import './styles.css'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const body = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata = {
  title: 'link.cny.sh — send a link, make it land',
  description: 'Paste a URL. See how it will look on Twitter, Discord, and iMessage before you share it.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="atmosphere" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
          <div className="film" />
        </div>
        <Stardust />
        <main>{children}</main>
      </body>
    </html>
  )
}
