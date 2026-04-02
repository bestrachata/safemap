import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',   // exposes safe-area-inset-* CSS env vars on iOS
}

export const metadata: Metadata = {
  title: 'AssureWay — Navigate with Confidence',
  description: 'A safety-first navigation platform. Explore safety heatmaps, find the safest route, and travel with confidence.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AssureWay',
  },
  icons: {
    icon: '/icon-512.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'AssureWay',
    description: 'Navigate with confidence using real-time safety heatmaps.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
