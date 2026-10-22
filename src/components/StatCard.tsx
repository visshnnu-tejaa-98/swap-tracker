import type { CSSProperties, ReactNode } from 'react'
import { useCountUp } from '../hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  description?: ReactNode
  /** CSS colour for the left accent strip */
  accent?: string
  /** Position in a group, used to stagger the entrance animation */
  index?: number
}

export default function StatCard({ label, value, description, accent, index = 0 }: StatCardProps) {
  const display = useCountUp(value)
  const style = { '--accent': accent, '--i': index } as CSSProperties
  return (
    <div className="card stat-card animate-in" style={style}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{display.toLocaleString('en-IN')}</div>
      {description && <div className="stat-hint">{description}</div>}
    </div>
  )
}
