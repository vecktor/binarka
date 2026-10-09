'use client'

import { useEffect } from 'react'

// Renders nothing: opens the settings panel on load for the /settings*/ routes only (review
// capture, iteration 14). On the real page the gear button opens it natively (no script).
// Iteration 15: focusOption puts the focus on that theme option (the /settings-focus/ route), so
// its :focus-visible ring is in the shot; re-applied once the window gains focus, like the
// confirm and «Почати» focus fixes.
export function OpenSettingsPanel({ focusOption }: { focusOption?: string }) {
  useEffect(() => {
    const panel = document.getElementById('settings')
    if (!panel) return
    if (!panel.matches(':popover-open')) panel.showPopover()
    if (!focusOption) return undefined
    const option = panel.querySelector<HTMLButtonElement>(`[data-theme-option="${focusOption}"]`)
    if (!option) return undefined
    option.focus()
    if (document.hasFocus()) return undefined
    const refocus = () => {
      option.blur()
      option.focus()
    }
    window.addEventListener('focus', refocus, { once: true })
    return () => window.removeEventListener('focus', refocus)
  }, [focusOption])

  return null
}
