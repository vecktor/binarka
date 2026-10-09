'use client'

import { useEffect } from 'react'

// Renders nothing: opens the setup sheet on load for the /setup*/ routes only (review
// capture). On the real page the summary button opens it natively (no script).
// Iteration 14: focusStart puts the focus on «Почати» (the marked-choice route), so its
// :focus-visible ring is in the shot. Like the confirm focus fix, the focus is applied again
// once the window gains focus (the capture frame focuses it on iframe load, which can come
// after this effect).
export function OpenSetupSheet({ focusStart = false }: { focusStart?: boolean }) {
  useEffect(() => {
    const sheet = document.getElementById('setup')
    if (!sheet) return
    if (!sheet.matches(':popover-open')) sheet.showPopover()
    if (!focusStart) return undefined
    const start = sheet.querySelector<HTMLButtonElement>('[data-action="setup-start"]')
    if (!start) return undefined
    start.focus()
    if (document.hasFocus()) return undefined
    const refocus = () => {
      start.blur()
      start.focus()
    }
    window.addEventListener('focus', refocus, { once: true })
    return () => window.removeEventListener('focus', refocus)
  }, [focusStart])

  return null
}
