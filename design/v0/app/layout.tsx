import type { Metadata, Viewport } from 'next'
import './binarka.css'

export const metadata: Metadata = {
  title: 'Бінарка',
  description: 'Бінарка — логічна головоломка з нулів і одиниць.',
}

// Iteration 14 (TD-Q13): no media-keyed colour scheme or theme colour here. The inline head
// script below sets data-theme on <html> (the effective theme), and the one theme-color meta
// follows it; color-scheme comes from the stylesheet (:root light, :root[data-theme='dark'] dark).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The rules sheet pads its bottom by env(safe-area-inset-bottom), which needs this.
  viewportFit: 'cover',
}

// A classic inline script in <head>, run before the body is parsed: it resolves the effective
// theme and sets data-theme and the theme-color meta before the first paint (FR-104, FR-106,
// FR-116). The design reference stores nothing: the choice is "auto" (the system theme, from
// matchMedia), except on the two design-only routes that show a manual override (review
// capture only; the product reads its stored choice instead). While on auto it follows a
// change of the system theme live (FR-105). That listener is also what makes the dark capture
// stable: in about 4 of 59 dark shots headless Chrome applied preferredColorScheme=dark only
// after the head script had run, so a one-shot read painted the page light.
const THEME_SCRIPT = `(function(){var d=document.documentElement;var forced={'/settings-light/':'light','/settings-dark/':'dark'}[location.pathname];var q=null;try{q=window.matchMedia('(prefers-color-scheme: dark)')}catch(e){}function apply(){var t=forced||(q&&q.matches?'dark':'light');d.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#1a1714':'#f7f3ea')}apply();if(q&&!forced){if(q.addEventListener)q.addEventListener('change',apply);else if(q.addListener)q.addListener(apply)}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f7f3ea" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
