import { useEffect, useState } from 'react'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates a number from 0 to `target` with an ease-out curve. */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
