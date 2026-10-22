import { lazy, Suspense, type CSSProperties, type ReactNode } from 'react'
import { Activity } from 'lucide-react'
import { RANGES, useRange } from '../hooks/useRange'

// echarts is large; keep it out of the initial bundle
const SwapTimelineChart = lazy(() => import('./SwapTimelineChart'))

interface SwapChartCardProps {
  action?: ReactNode
  className?: string
  style?: CSSProperties
}

export default function SwapChartCard({ action, className = '', style }: SwapChartCardProps) {
  const [range, setRange] = useRange()
  return (
    <section className={`card chart-card ${className}`} style={style}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><Activity size={18} aria-hidden="true" />Swaps over time</h2>
          <div className="card-subtitle">{range === 'today' ? 'Hourly' : 'Daily'} swap attempts by outcome (IST)</div>
        </div>
        <div className="card-actions">
          <div className="segmented" role="tablist">
            {RANGES.map((r) => (
              <button key={r.value} role="tab" aria-selected={range === r.value} className={range === r.value ? 'active' : ''} onClick={() => setRange(r.value)}>
                {r.label}
              </button>
            ))}
          </div>
          {action}
        </div>
      </div>
      <Suspense fallback={<div className="chart-skeleton" />}>
        <SwapTimelineChart range={range} />
      </Suspense>
    </section>
  )
}
