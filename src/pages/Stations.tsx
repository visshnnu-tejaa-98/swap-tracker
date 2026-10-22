import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import Badge from '../components/Badge'
import StationPanel from '../components/StationPanel'
import TablePager from '../components/TablePager'
import { getBatteryById, getStationById, stations, type ChargingStation, type StationStatus } from '../mock-data'
import { STATION_STATUS, formatDateTime } from '../utils/format'

const PAGE_SIZE = 25

type SortKey = 'name' | 'city' | 'chargedBatteries' | 'chargingBatteries' | 'notWorkingBatteries' | 'emptyDoors' | 'totalSwaps' | 'lastSwapAt'

const COLUMNS: { key: SortKey | null; label: string; align?: 'right' }[] = [
  { key: 'name', label: 'Station' },
  { key: 'city', label: 'City' },
  { key: null, label: 'Status' },
  { key: null, label: 'Doors' },
  { key: 'chargedBatteries', label: 'Charged', align: 'right' },
  { key: 'chargingBatteries', label: 'Charging', align: 'right' },
  { key: 'notWorkingBatteries', label: 'Not working', align: 'right' },
  { key: 'emptyDoors', label: 'Empty', align: 'right' },
  { key: 'totalSwaps', label: 'Swaps', align: 'right' },
  { key: 'lastSwapAt', label: 'Last swap' },
]

const sortValue = (s: ChargingStation, key: SortKey) => (key === 'city' ? s.location.city : s[key] ?? '')
const cities = [...new Set(stations.map((s) => s.location.city))].sort()

export default function Stations() {
  // the open station lives in the URL (?station=) so a panel can be linked to directly
  const [params, setParams] = useSearchParams()
  const selected = getStationById(params.get('station') ?? '')
  const openStation = (id: string) => setParams((p) => (p.set('station', id), p))
  const closePanel = useCallback(() => setParams((p) => (p.delete('station'), p)), [setParams])

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StationStatus | 'all'>('all')
  const [city, setCity] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'totalSwaps', dir: -1 })
  const [page, setPage] = useState(0)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: stations.length }
    for (const s of stations) counts[s.status] = (counts[s.status] ?? 0) + 1
    return counts
  }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stations
      .filter((s) => (status === 'all' || s.status === status) && (city === 'all' || s.location.city === city))
      .filter((s) => !q || [s.name, s.stationCode, s.location.area, s.location.address].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = sortValue(a, sort.key)
        const bv = sortValue(b, sort.key)
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir
      })
  }, [query, status, city, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  // any filter change sends you back to the first page
  const withReset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(0)
  }
  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === 'name' || key === 'city' ? 1 : -1 }))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stations</h1>
          <div className="page-subtitle">{stations.length} swap stations across {cities.length} cities</div>
        </div>
      </div>

      <section className="card table-card">
        <div className="table-toolbar">
          <div className="segmented" role="tablist" aria-label="Filter by status">
            {(['all', 'online', 'offline', 'maintenance'] as const).map((s) => (
              <button key={s} role="tab" aria-selected={status === s} className={status === s ? 'active' : ''} onClick={() => withReset(setStatus)(s)}>
                {s === 'all' ? 'All' : STATION_STATUS[s].label}
                <span className="segmented-count">{statusCounts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select className="select" value={city} onChange={(e) => withReset(setCity)(e.target.value)} aria-label="Filter by city">
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="search">
              <Search size={15} aria-hidden="true" />
              <input value={query} onChange={(e) => withReset(setQuery)(e.target.value)} placeholder="Search name, code or area" aria-label="Search stations" />
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
              {visible.map((s) => (
                <tr
                  key={s.id}
                  className={selected?.id === s.id ? 'selected' : undefined}
                  onClick={() => openStation(s.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openStation(s.id))}
                  tabIndex={0}
                >
                  <td>
                    <div className="cell-primary">{s.name.replace(/^Zeno | Swap Station$/g, '')}</div>
                    <div className="cell-secondary">{s.stationCode}</div>
                  </td>
                  <td>{s.location.city}</td>
                  <td><Badge tone={STATION_STATUS[s.status].tone}>{STATION_STATUS[s.status].label}</Badge></td>
                  <td>
                    <div className="door-bar door-bar-table" aria-label={`${s.chargedBatteries} charged, ${s.chargingBatteries} charging, ${s.notWorkingBatteries} not working, ${s.emptyDoors} empty`}>
                      {s.doors.map((d) => (
                        <i key={d.doorNumber} className={d.batteryId ? getBatteryById(d.batteryId)?.status : ''} />
                      ))}
                    </div>
                  </td>
                  <td className="num">{s.chargedBatteries}</td>
                  <td className="num">{s.chargingBatteries}</td>
                  <td className="num">{s.notWorkingBatteries || <span className="muted">0</span>}</td>
                  <td className="num">{s.emptyDoors}</td>
                  <td className="num"><strong>{s.totalSwaps}</strong></td>
                  <td className="cell-secondary">{s.lastSwapAt ? formatDateTime(s.lastSwapAt) : '—'}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr className="empty-row"><td colSpan={COLUMNS.length}>No stations match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePager page={current} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
      </section>

      <StationPanel station={selected} onClose={closePanel} />
    </div>
  )
}
