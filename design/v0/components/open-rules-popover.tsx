'use client'

import { useEffect } from 'react'

// Renders nothing: opens the rules popover on load for the /rules/ route only.
// On the real page the «Правила» button opens it natively (no script).
export function OpenRulesPopover() {
  useEffect(() => {
    const popover = document.getElementById('rules')
    if (!popover || popover.matches(':popover-open')) return
    popover.showPopover()
  }, [])

  return null
}
