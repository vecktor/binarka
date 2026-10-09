'use client'

import { useEffect } from 'react'

// Renders nothing: opens the setup sheet on load for the /setup/ and /setup-four/ routes
// only (review capture). On the real page the summary button opens it natively (no script).
export function OpenSetupSheet() {
  useEffect(() => {
    const sheet = document.getElementById('setup')
    if (!sheet) return
    if (!sheet.matches(':popover-open')) sheet.showPopover()
  }, [])

  return null
}
