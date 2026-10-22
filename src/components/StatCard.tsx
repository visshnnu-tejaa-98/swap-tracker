import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useCountUp } from '../hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  description?: ReactNode
  icon?: LucideIcon
  accent?: string
  index?: number
}

export default function StatCard({ label, value, description, icon: Icon, accent, index = 0 }: StatCardProps) {
  const display = useCountUp(value)
  const style = { '--accent': accent, '--i': index } as CSSProperties
  return (
    <div className="card stat-card animate-in" style={style}>
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        {Icon && (
          <div className="stat-icon">
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="stat-value">{display.toLocaleString('en-IN')}</div>
      {description && <div className="stat-hint">{description}</div>}
    </div>
  )
}
