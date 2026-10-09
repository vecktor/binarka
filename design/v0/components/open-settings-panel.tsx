'use client'

import { useEffect } from 'react'

// Renders nothing: opens the settings panel on load for the /settings*/ routes only (review
// capture, iteration 14). On the real page the gear button opens it natively (no script).
export function OpenSettingsPanel() {
  useEffect(() => {
    const panel = document.getElementById('settings')
    if (!panel) return
    if (!panel.matches(':popover-open')) panel.showPopover()
  }, [])

  return null
}
