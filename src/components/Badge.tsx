import type { ReactNode } from 'react'
import type { Tone } from '../utils/format'

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
