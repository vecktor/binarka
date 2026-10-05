'use client'

import { useEffect } from 'react'

// Renders nothing: opens the existing <dialog> as a modal so ::backdrop applies,
// and moves focus to the safe default («Скасувати»).
export function OpenConfirmDialog() {
  useEffect(() => {
    const dialog = document.querySelector<HTMLDialogElement>('[data-dialog="confirm"]')
    if (!dialog || dialog.open) return
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('[data-confirm="no"]')?.focus()
  }, [])

  return null
}
