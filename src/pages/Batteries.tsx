import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Badge from '../components/Badge'
import BatteryPanel from '../components/BatteryPanel'
import { batteries, getBatteryById, getStationById, getUserById, type Battery, type BatteryCondition, type BatteryStatus } from '../mock-data'
import { BATTERY_CONDITION, BATTERY_STATUS, formatDateTime } from '../utils/format'

const PAGE_SIZE = 25

type SortKey = 'batteryId' | 'health' | 'chargeLevel' | 'chargingCyclesCompleted' | 'lastSwappedAt'

const COLUMNS: { key: SortKey | null; label: string; align?: 'right' }[] = [
  { key: 'batteryId', label: 'Battery' },
  { key: null, label: 'Status' },
  { key: null, label: 'Condition' },
  { key: 'health', label: 'Health' },
  { key: 'chargeLevel', label: 'Charge', align: 'right' },
  { key: 'chargingCyclesCompleted', label: 'Cycles', align: 'right' },
  { key: null, label: 'Location' },
  { key: 'lastSwappedAt', label: 'Last swapped' },
]

const locationText = (b: Battery) => {
  if (b.location.type === 'station') {
    const s = getStationById(b.location.stationId)
    return { primary: s?.location.area ?? b.location.stationId, secondary: `${s?.location.city} · door ${b.location.doorNumber}` }
  }
  const u = getUserById(b.location.userId)
  return { primary: u?.name ?? b.location.userId, secondary: `Scooter ${b.location.scooterId}` }
}

export default function Batteries() {
  // the open battery lives in the URL (?battery=) so a panel can be linked to directly
  const [params, setParams] = useSearchParams()
  const selected = getBatteryById(params.get('battery') ?? '')
  const openBattery = (id: string) => setParams((p) => (p.set('battery', id), p))
  const closePanel = useCallback(() => setParams((p) => (p.delete('battery'), p)), [setParams])

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<BatteryStatus | 'all'>('all')
  const [condition, setCondition] = useState<BatteryCondition | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'batteryId', dir: 1 })
  const [page, setPage] = useState(0)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: batteries.length }
    for (const b of batteries) counts[b.status] = (counts[b.status] ?? 0) + 1
    return counts
  }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return batteries
      .filter((b) => (status === 'all' || b.status === status) && (condition === 'all' || b.condition === condition))
      .filter((b) => !q || b.batteryId.toLowerCase().includes(q) || b.serialNumber.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
      .sort((a, b) => {
        const av = a[sort.key] ?? ''
        const bv = b[sort.key] ?? ''
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir
      })
  }, [query, status, condition, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  // any filter change sends you back to the first page
  const withReset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(0)
  }
  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === 'batteryId' ? 1 : -1 }))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Batteries</h1>
          <div className="page-subtitle">{batteries.length} batteries across stations and scooters</div>
        </div>
      </div>

      <section className="card table-card">
        <div className="table-toolbar">
          <div className="segmented" role="tablist" aria-label="Filter by status">
            {(['all', 'charged', 'charging', 'in_use', 'faulty'] as const).map((s) => (
              <button key={s} role="tab" aria-selected={status === s} className={status === s ? 'active' : ''} onClick={() => withReset(setStatus)(s)}>
                {s === 'all' ? 'All' : BATTERY_STATUS[s].label}
                <span className="segmented-count">{statusCounts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select className="select" value={condition} onChange={(e) => withReset(setCondition)(e.target.value as BatteryCondition | 'all')} aria-label="Filter by condition">
              <option value="all">All conditions</option>
              {(Object.keys(BATTERY_CONDITION) as BatteryCondition[]).map((c) => (
                <option key={c} value={c}>{BATTERY_CONDITION[c].label}</option>
              ))}
            </select>
            <label className="search">
              <Search size={15} aria-hidden="true" />
              <input value={query} onChange={(e) => withReset(setQuery)(e.target.value)} placeholder="Search battery ID or serial" aria-label="Search batteries" />
            </label>
          </div>
        </div>

        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.label} className={c.align === 'right' ? 'num' : undefined} aria-sort={c.key && sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                    {c.key ? (
                      <button className="th-sort" onClick={() => toggleSort(c.key!)}>
                        {c.label}
                        {sort.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const loc = locationText(b)
                return (
                  <tr
                    key={b.id}
                    className={selected?.id === b.id ? 'selected' : undefined}
                    onClick={() => openBattery(b.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openBattery(b.id))}
                    tabIndex={0}
                  >
                    <td>
                      <div className="cell-primary">{b.batteryId}</div>
                      <div className="cell-secondary">{b.id}</div>
                    </td>
                    <td><Badge tone={BATTERY_STATUS[b.status].tone}>{BATTERY_STATUS[b.status].label}</Badge></td>
                    <td><Badge tone={BATTERY_CONDITION[b.condition].tone}>{BATTERY_CONDITION[b.condition].label}</Badge></td>
                    <td>
                      <span className="meter-inline"><span className="meter"><span style={{ width: `${b.health}%` }} /></span>{b.health}%</span>
                    </td>
                    <td className="num">{b.chargeLevel}%</td>
                    <td className="num">{b.chargingCyclesCompleted.toLocaleString('en-IN')}</td>
                    <td>
                      <div className="cell-primary">{loc.primary}</div>
                      <div className="cell-secondary">{loc.secondary}</div>
                    </td>
                    <td className="cell-secondary">{b.lastSwappedAt ? formatDateTime(b.lastSwappedAt) : '—'}</td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr className="empty-row"><td colSpan={COLUMNS.length}>No batteries match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="muted">
            {rows.length === 0 ? 0 : current * PAGE_SIZE + 1}–{Math.min(rows.length, (current + 1) * PAGE_SIZE)} of {rows.length}
          </span>
          <div className="pager">
            <button className="icon-button" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="muted">Page {current + 1} of {pageCount}</span>
            <button className="icon-button" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <BatteryPanel battery={selected} onClose={closePanel} />
    </div>
  )
}
