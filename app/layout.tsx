import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SafeMap — Navigate with Confidence',
  description: 'A safety-first navigation platform. Explore safety heatmaps, find the safest route, and plan trips with confidence.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'SafeMap',
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
