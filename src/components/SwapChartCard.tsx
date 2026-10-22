import { lazy, Suspense, useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { Activity } from 'lucide-react'
import { RANGES, useRange } from '../hooks/useRange'
import TransactionsPanel from './TransactionsPanel'
import type { ChartSelection } from './SwapTimelineChart'

// echarts is large; keep it out of the initial bundle
const SwapTimelineChart = lazy(() => import('./SwapTimelineChart'))

interface SwapChartCardProps {
  action?: ReactNode
  className?: string
  style?: CSSProperties
}

export default function SwapChartCard({ action, className = '', style }: SwapChartCardProps) {
  const [range, setRange] = useRange()
  const [selection, setSelection] = useState<ChartSelection | null>(null)
  const closePanel = useCallback(() => setSelection(null), [])
  return (
    <section className={`card chart-card ${className}`} style={style}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><Activity size={18} aria-hidden="true" />Swaps over time</h2>
          <div className="card-subtitle">{range === 'today' ? 'Hourly' : 'Daily'} swap attempts by outcome (IST) · click a point to see its transactions</div>
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
        <SwapTimelineChart range={range} onPointClick={setSelection} />
      </Suspense>
      <TransactionsPanel selection={selection} onClose={closePanel} />
    </section>
  )
}
