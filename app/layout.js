import './globals.css'
import './print.css'
import Link from 'next/link'
import ServiceWorkerRegistration from './sw-register'
import BottomNav from './components/BottomNav'

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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kiran Beauty Shop" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
      </head>
      <body>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center h-16">
                <h1 className="text-xl font-bold text-primary-600">Kiran Beauty Shop</h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 main-content">
            {children}
          </main>

          {/* Bottom Navigation */}
          <BottomNav />
        </div>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
} 