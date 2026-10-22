import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import StatCard from '../components/StatCard'
import type { TimeRange } from '../components/SwapTimelineChart'
import { MOCK_NOW, batteries, getBatteryById, stations, transactions } from '../mock-data'

// echarts is large; keep it out of the initial bundle
const SwapTimelineChart = lazy(() => import('../components/SwapTimelineChart'))

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
]

const vars = (v: Record<string, string | number>) => v as CSSProperties

export default function Dashboard() {
  const [range, setRange] = useState<TimeRange>('week')

  const stats = useMemo(() => {
    const atStations = batteries.filter((b) => b.location.type === 'station').length
    const swaps = transactions.filter((t) => t.status !== 'failed')
    return {
      batteries: batteries.length,
      atStations,
      inScooters: batteries.length - atStations,
      stations: stations.length,
      onlineStations: stations.filter((s) => s.status === 'online').length,
      newBatteries: batteries.filter((b) => b.condition === 'new').length,
      swaps: swaps.length,
      batteriesSwapped: swaps.reduce((n, t) => n + t.swapCount, 0),
      successRate: Math.round((transactions.filter((t) => t.status === 'success').length / transactions.length) * 100),
    }
  }, [])

  const busiest = useMemo(() => [...stations].sort((a, b) => b.totalSwaps - a.totalSwaps).slice(0, 6), [])
  const now = MOCK_NOW.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">
            <span className="live-dot" />
            Network overview · as of{' '}
            {now}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          index={1}
          label="Total batteries"
          value={stats.batteries}
          accent="var(--color-ink)"
          description={<><strong>{stats.atStations}</strong> at stations · <strong>{stats.inScooters}</strong> in scooters</>}
        />
        <StatCard
          index={2}
          label="Charging stations"
          value={stats.stations}
          accent="var(--color-info)"
          description={<><strong>{stats.onlineStations}</strong> online · {stats.stations - stats.onlineStations} offline / maintenance</>}
        />
        <StatCard
          index={3}
          label="New batteries"
          value={stats.newBatteries}
          accent="var(--color-success)"
          description={<>Under 25% of 1,500 cycles used</>}
        />
        <StatCard
          index={4}
          label="Swap transactions"
          value={stats.swaps}
          accent="var(--color-primary)"
          description={<><strong>{stats.batteriesSwapped}</strong> batteries swapped · <strong>{stats.successRate}%</strong> success</>}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card animate-in" style={vars({ '--i': 5 })}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Swaps over time</h2>
              <div className="card-subtitle">{range === 'today' ? 'Hourly' : 'Daily'} swap attempts by outcome (IST)</div>
            </div>
            <div className="segmented" role="tablist">
              {RANGES.map((r) => (
                <button key={r.value} role="tab" aria-selected={range === r.value} className={range === r.value ? 'active' : ''} onClick={() => setRange(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Suspense fallback={<div className="chart-skeleton" />}>
            <SwapTimelineChart range={range} />
          </Suspense>
        </section>

        <section className="card animate-in" style={vars({ '--i': 6 })}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Busiest stations</h2>
              <div className="card-subtitle">By swaps in the last 30 days</div>
            </div>
          </div>
          <ol className="station-list">
            {busiest.map((s, i) => (
              <li key={s.id} className="station-row animate-in" style={vars({ '--i': 6 + i * 0.6 })}>
                <div className="station-rank">{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="station-name">{s.name.replace(/^Zeno | Swap Station$/g, '')}</div>
                  <div className="station-meta">
                    {s.location.city} · {s.chargedBatteries} charged · {s.emptyDoors} empty
                  </div>
                  <div className="door-bar" title="Doors">
                    {s.doors.map((d, di) => (
                      <i
                        key={d.doorNumber}
                        className={d.batteryId ? getBatteryById(d.batteryId)?.status : ''}
                        style={vars({ '--i': 6 + i * 0.6, '--d': di })}
                      />
                    ))}
                  </div>
                </div>
                <div className="station-swaps">
                  {s.totalSwaps}
                  <span>swaps</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="legend">
            <span><i style={vars({ '--c': 'var(--color-success)' })} />Charged</span>
            <span><i style={vars({ '--c': 'var(--color-charging)' })} />Charging</span>
            <span><i style={vars({ '--c': 'var(--color-danger)' })} />Not working</span>
            <span><i style={vars({ '--c': 'var(--color-border)' })} />Empty</span>
          </div>
        </section>
      </div>
    </div>
  )
}
