import { Lato, Libre_Franklin } from 'next/font/google'
import React from 'react'
import './styles.css'

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
})

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata = {
  description: 'Rockbusters — leading community of experienced rock climbing guides & coaches.',
  title: 'Rockbusters',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <html lang="en" className={`${lato.variable} ${libreFranklin.variable}`}>
      <body>{children}</body>
    </html>
  )
}
