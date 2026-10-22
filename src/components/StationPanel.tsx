import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, PlugZap, WifiOff } from 'lucide-react'
import { getBatteryById, getTransactionsForStation, type ChargingStation } from '../mock-data'
import { useLastDefined } from '../hooks/useLastDefined'
import { BATTERY_STATUS, STATION_STATUS, TRANSACTION_STATUS, formatDate, formatDateTime, formatTime, titleCase } from '../utils/format'
import Badge from './Badge'
import SidePanel from './SidePanel'

const RECENT_LIMIT = 5

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="spec-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export default function StationPanel({ station: current, onClose }: { station: ChargingStation | undefined; onClose: () => void }) {
  const station = useLastDefined(current)

  const activity = useMemo(() => {
    if (!station) return { recent: [], successRate: 0, total: 0 }
    const all = getTransactionsForStation(station.id)
    const success = all.filter((t) => t.status === 'success').length
    return { recent: all.slice(-RECENT_LIMIT).reverse(), successRate: all.length ? Math.round((success / all.length) * 100) : 0, total: all.length }
  }, [station])

  if (!station) return <SidePanel open={false} onClose={onClose} label="Station details" />

  const status = STATION_STATUS[station.status]
  const { location: l } = station

  return (
    <SidePanel
      open={current !== undefined}
      onClose={onClose}
      label="Station details"
      icon={PlugZap}
      tone={status.color}
      title={station.name.replace(/^Zeno | Swap Station$/g, '')}
      subtitle={`${station.stationCode} · ${l.city}, ${l.state}`}
      meta={
        <>
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone="neutral">{station.connectivity === 'disconnected' ? 'Disconnected' : station.connectivity.toUpperCase()}</Badge>
        </>
      }
    >
      <div className="panel-summary">
        <div><strong style={{ color: 'var(--color-success)' }}>{station.chargedBatteries}</strong><span>Charged</span></div>
        <div><strong style={{ color: 'var(--color-charging)' }}>{station.chargingBatteries}</strong><span>Charging</span></div>
        <div><strong style={{ color: 'var(--color-danger)' }}>{station.notWorkingBatteries}</strong><span>Not working</span></div>
        <div><strong>{station.emptyDoors}</strong><span>Empty</span></div>
      </div>

      {station.status !== 'online' && (
        <div className={`panel-callout ${station.status === 'offline' ? 'danger' : 'warning'}`}>
          {station.status === 'offline' ? <WifiOff size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
          <div>
            {station.status === 'offline' ? 'Station is offline. ' : 'Station is under maintenance. '}
            Last heartbeat <strong>{formatDateTime(station.lastHeartbeatAt)}</strong>.
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3 className="panel-section-title">Doors <span>click a battery to open it</span></h3>
        <div className="door-grid">
          {station.doors.map((d) => {
            const b = d.batteryId ? getBatteryById(d.batteryId) : undefined
            if (!b) return <div key={d.doorNumber} className="door empty" title="Empty">{d.doorNumber}</div>
            return (
              <Link
                key={d.doorNumber}
                to={`/batteries?battery=${b.id}`}
                className={`door ${b.status}`}
                title={`${b.batteryId} · ${BATTERY_STATUS[b.status].label} · ${b.chargeLevel}%`}
              >
                <span className="door-number">{d.doorNumber}</span>
                <span className="door-charge">{b.chargeLevel}%</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Station info</h3>
        <dl className="spec-list">
          <Row label="Address">{l.address}, {l.pincode}</Row>
          <Row label="Coordinates">{l.latitude.toFixed(4)}, {l.longitude.toFixed(4)}</Row>
          <Row label="Operating hours">{station.operatingHours.open}–{station.operatingHours.close}</Row>
          <Row label="Last heartbeat">{formatDateTime(station.lastHeartbeatAt)}</Row>
          <Row label="Installed">{formatDate(station.installedAt)}</Row>
          <Row label="Swaps (30 days)">{station.totalSwaps} · {activity.successRate}% success</Row>
        </dl>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">
          Recent transactions <span>{activity.total > RECENT_LIMIT ? `latest ${RECENT_LIMIT} of ${activity.total}` : `${activity.total} total`}</span>
        </h3>
        {activity.recent.length === 0 ? (
          <div className="panel-empty">No transactions in the last 30 days.</div>
        ) : (
          <ul className="panel-list">
            {activity.recent.map((t) => (
              <li key={t.id}>
                <Link to={`/transactions/details/${t.id}`} className="txn-row">
                  <span className="txn-time">{formatTime(t.swappedAt)}</span>
                  <div className="txn-main">
                    <div className="txn-user">{t.userName}</div>
                    <div className="txn-meta">{formatDate(t.swappedAt)} · {t.swapCount} of 2 swapped</div>
                  </div>
                  <div className="txn-side">
                    {t.status !== 'success' && <Badge tone={TRANSACTION_STATUS[t.status].tone}>{t.failureReason ? titleCase(t.failureReason) : TRANSACTION_STATUS[t.status].label}</Badge>}
                    <ChevronRight size={16} aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanel>
  )
}
