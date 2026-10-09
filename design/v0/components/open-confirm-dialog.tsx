'use client'

import { useEffect } from 'react'

// Renders nothing: opens the existing <dialog> as a modal so ::backdrop applies,
// and moves focus to the safe default («Скасувати»).
// If the window does not have focus yet (the capture frame focuses it on iframe load, which can
// come after this effect), focus the button again once the window gains focus: otherwise
// :focus-visible is sometimes never painted and the capture is not byte-stable.
export function OpenConfirmDialog() {
  useEffect(() => {
    const dialog = document.querySelector<HTMLDialogElement>('[data-dialog="confirm"]')
    if (!dialog || dialog.open) return
    dialog.showModal()
    const cancel = dialog.querySelector<HTMLButtonElement>('[data-confirm="no"]')
    cancel?.focus()
    if (cancel && !document.hasFocus()) {
      const refocus = () => {
        cancel.blur()
        cancel.focus()
      }
      window.addEventListener('focus', refocus, { once: true })
      return () => window.removeEventListener('focus', refocus)
    }
    return undefined
  }, [])

  return null
}
