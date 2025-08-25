import './globals.css'
import './print.css'
import Link from 'next/link'
import ServiceWorkerRegistration from './sw-register'
import BottomNav from './components/BottomNav'
import { Inter } from 'next/font/google'
import { AuthProvider } from './contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Kiran Beauty Shop - Billing System',
  description: 'Mobile-first beauty store billing system',
  manifest: '/manifest.json',
  themeColor: '#a855f7',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
} 