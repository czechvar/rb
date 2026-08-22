import { Bebas_Neue, Inter } from 'next/font/google'
import React from 'react'
import './styles.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata = {
  // Absolutizes relative og:image URLs (e.g. /api/media/file/…) in child metadata.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rockbusters.net'),
  description: 'Rockbusters — leading community of experienced rock climbing guides & coaches.',
  title: 'Rockbusters',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body>{children}</body>
    </html>
  )
}
