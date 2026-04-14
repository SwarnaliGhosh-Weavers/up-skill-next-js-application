import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = { title: 'ChatApp', description: 'Real-time chat' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
