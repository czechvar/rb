import { Bebas_Neue, Inter } from 'next/font/google'
import React, { Suspense } from 'react'
import { DirectGa4 } from '@/components/analytics/DirectGa4'
import { RouteProgress } from '@/components/navigation/RouteProgress'
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
  description: 'Rockbusters — leading community of experienced rock climbing guides & coaches.',
  title: 'Rockbusters',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body data-theme="rockbusters">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <DirectGa4 />
      </body>
    </html>
  )
}
