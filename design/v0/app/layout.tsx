import type { Metadata, Viewport } from 'next'
import './binarka.css'

export const metadata: Metadata = {
  title: 'Бінарка',
  description: 'Бінарка — логічна головоломка з нулів і одиниць.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The rules sheet pads its bottom by env(safe-area-inset-bottom), which needs this.
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ea' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1714' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}
