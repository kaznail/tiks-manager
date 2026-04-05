import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

// Since we are using an Arabic UI, usually Tajawal/Cairo is better.
// The design system fallback mentions Tajawal, but Stitch JSON lists Inter. 
// For better RTL presentation, we load Inter as it supports basic characters, but CSS will fallback to system arabic.

export const metadata: Metadata = {
  title: 'موقع شؤون الموظفين',
  description: 'منصة إدارة شؤون الموظفين الذكية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${plusJakarta.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen bg-surfaceContainerLow">
        {children}
      </body>
    </html>
  )
}
