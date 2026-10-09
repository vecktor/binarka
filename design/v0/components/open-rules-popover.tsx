'use client'

import { useEffect } from 'react'

// Renders nothing: opens the rules popover on load for the /rules/ routes only.
// On the real page the «Правила» button opens it natively (no script).
// scrollToEnd (the /rules-techniques/ route, review capture only) scrolls the panel to its
// end, so the shot shows «Складніші прийоми» and the sticky «Зрозуміло»; where the
// panel does not scroll it stays put.
// Iteration 11: the scroll is repeated after layout (two animation frames) and again once
// the window gains focus (the capture frame focuses it on iframe load, which can come after
// this effect), like the confirm focus fix: a single immediate scroll sometimes ran before
// the panel had its height, and the capture was not byte-stable.
export function OpenRulesPopover({ scrollToEnd = false }: { scrollToEnd?: boolean }) {
  useEffect(() => {
    const popover = document.getElementById('rules')
    if (!popover) return
    if (!popover.matches(':popover-open')) popover.showPopover()
    if (!scrollToEnd) return undefined

    const scroll = () => {
      popover.scrollTop = popover.scrollHeight
    }
    let frame = 0
    const afterLayout = () => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(scroll)
      })
    }
    scroll()
    afterLayout()
    const onFocus = () => {
      scroll()
      afterLayout()
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('load', onFocus, { once: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('load', onFocus)
    }
  }, [scrollToEnd])

  return null
}
