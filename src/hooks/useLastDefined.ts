import { useState } from 'react'

/** Remembers the last non-null value, so a closing panel keeps showing its content while it animates out. */
export function useLastDefined<T>(value: T | null | undefined) {
  const [last, setLast] = useState(value ?? undefined)
  if (value != null && value !== last) setLast(value)
  return value ?? last
}
