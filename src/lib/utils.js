import { useEffect, useState, useCallback } from 'react'

// Risk score: high score = high risk (inverted from typical percentage)
// Threshold: 75+ = danger (AT RISK), 60–74 = warn (WATCH), <60 = ok (CLEAR)
export const riskTone = (score) =>
  score >= 75 ? 'danger' : score >= 60 ? 'warn' : 'ok'

export const riskColorClass = (score) =>
  score >= 75 ? 'text-danger' : score >= 60 ? 'text-warn' : 'text-ok'

export const riskLabel = (score) =>
  score >= 75 ? 'AT RISK' : score >= 60 ? 'WATCH' : 'CLEAR'

export const riskBgColor = (score) =>
  score >= 75 ? '#C43820' : score >= 60 ? '#C4920A' : '#3A8A5A'

// Exit animation helper — delays unmount so CSS exit animation can play.
// Usage: const { exiting, exit } = useExitAnimation(200)
//   - Call exit(onDone) to start; component gets `exiting` class, unmounts after duration.
export function useExitAnimation(duration = 200) {
  const [exiting, setExiting] = useState(false)
  const exit = useCallback((onDone) => {
    setExiting(true)
    setTimeout(() => { setExiting(false); onDone?.() }, duration)
  }, [duration])
  return { exiting, exit }
}

// Focus trap for modals, drawers, and dropdowns.
// Moves focus to first focusable element on mount; loops Tab/Shift-Tab within.
const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useFocusTrap(containerRef, isActive = true) {
  useEffect(() => {
    if (!isActive) return
    const el = containerRef.current
    if (!el) return
    const getFocusable = () => [...el.querySelectorAll(FOCUSABLE)]
    getFocusable()[0]?.focus({ preventScroll: true })
    function onKey(e) {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (!items.length) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isActive, containerRef])
}
