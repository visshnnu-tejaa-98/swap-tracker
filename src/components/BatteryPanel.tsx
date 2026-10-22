import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BatteryCharging, Bike, ChevronRight, Clock, MapPin, PlugZap } from 'lucide-react'
import { getStationById, getUserById, transactions, type Battery } from '../mock-data'
import { useLastDefined } from '../hooks/useLastDefined'
import { BATTERY_CONDITION, BATTERY_STATUS, TRANSACTION_STATUS, formatDate, formatDateTime, titleCase } from '../utils/format'
import Badge from './Badge'
import SidePanel from './SidePanel'

const STATUS_TONE = {
  charged: 'var(--color-success)',
  charging: 'var(--color-charging)',
  faulty: 'var(--color-danger)',
  in_use: 'var(--color-info)',
} as const

function Stat({ label, value, unit, pct, tone }: { label: string; value: string; unit?: string; pct: number; tone: string }) {
  return (
    <div className="panel-stat" style={{ '--tone': tone } as CSSProperties}>
      <span className="panel-stat-label">{label}</span>
      <span className="panel-stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      <span className="meter"><span style={{ width: `${Math.min(100, pct)}%` }} /></span>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="spec-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export default function BatteryPanel({ battery: current, onClose }: { battery: Battery | undefined; onClose: () => void }) {
  const battery = useLastDefined(current)

  const history = useMemo(() => {
    if (!battery) return []
    return transactions
      .filter((t) => t.insertedBatteryIds.includes(battery.id) || t.dispensedBatteryIds.includes(battery.id))
      .reverse()
  }, [battery])

  if (!battery) return <SidePanel open={false} onClose={onClose} label="Battery details" />

  const status = BATTERY_STATUS[battery.status]
  const condition = BATTERY_CONDITION[battery.condition]
  const tone = STATUS_TONE[battery.status]
  const loc = battery.location
  const station = loc.type === 'station' ? getStationById(loc.stationId) : undefined
  const user = loc.type === 'scooter' ? getUserById(loc.userId) : undefined
  const cyclesPct = (battery.chargingCyclesCompleted / battery.supportedChargingCycles) * 100

  return (
    <SidePanel
      open={current !== undefined}
      onClose={onClose}
      label="Battery details"
      icon={BatteryCharging}
      tone={tone}
      title={battery.batteryId}
      subtitle={`${battery.model} · ${battery.serialNumber}`}
      meta={
        <>
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone={condition.tone}>{condition.label}</Badge>
        </>
      }
    >
      <div className="panel-stats">
        <Stat label="Health" value={`${battery.health}`} unit="%" pct={battery.health} tone="var(--color-success)" />
        <Stat label="Charge" value={`${battery.chargeLevel}`} unit="%" pct={battery.chargeLevel} tone={tone} />
        <Stat
          label="Cycles"
          value={battery.chargingCyclesCompleted.toLocaleString('en-IN')}
          unit={`/${battery.supportedChargingCycles.toLocaleString('en-IN')}`}
          pct={cyclesPct}
          tone="var(--color-info)"
        />
      </div>

      {battery.faultReason && (
        <div className="panel-callout danger">
          <AlertTriangle size={16} aria-hidden="true" />
          <div><strong>{titleCase(battery.faultReason)}</strong>. This battery is not working and won't be dispensed.</div>
        </div>
      )}
      {battery.estimatedFullChargeAt && (
        <div className="panel-callout warning">
          <Clock size={16} aria-hidden="true" />
          <div>Fully charged by <strong>{formatDateTime(battery.estimatedFullChargeAt)}</strong></div>
        </div>
      )}

      <div className="panel-section">
        <h3 className="panel-section-title">Current location</h3>
        <div className="location-card">
          <span className="location-icon">
            {station ? <PlugZap size={16} aria-hidden="true" /> : <Bike size={16} aria-hidden="true" />}
          </span>
          {station && loc.type === 'station' && (
            <div className="location-text">
              <div className="location-name">{station.name.replace(/^Zeno | Swap Station$/g, '')} station</div>
              <div className="muted"><MapPin size={12} aria-hidden="true" /> {station.location.city}</div>
            </div>
          )}
          {user && (
            <div className="location-text">
              <div className="location-name">{user.name}'s scooter</div>
              <div className="muted">{user.scooter.model} · {user.scooter.registrationNumber}</div>
            </div>
          )}
          {loc.type === 'station' && <span className="location-tag">Door {loc.doorNumber}</span>}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Specifications</h3>
        <dl className="spec-list">
          <Row label="Capacity">{battery.capacityKwh} kWh · {battery.voltage} V</Row>
          <Row label="Cycles remaining">{battery.chargingCyclesRemaining.toLocaleString('en-IN')}</Row>
          <Row label="Last swapped">{battery.lastSwappedAt ? formatDateTime(battery.lastSwappedAt) : '—'}</Row>
          <Row label="Manufactured">{formatDate(battery.manufacturedAt)}</Row>
          <Row label="In service since">{formatDate(battery.createdAt)}</Row>
          <Row label="Internal ID">{battery.id}</Row>
        </dl>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Swap history <span>{history.length} in last 30 days</span></h3>
        {history.length === 0 ? (
          <div className="panel-empty">No swaps in the last 30 days.</div>
        ) : (
          <ul className="history">
            {history.map((t) => {
              const returned = t.insertedBatteryIds.includes(battery.id)
              return (
                <li key={t.id}>
                  <Link to={`/transactions/details/${t.id}`} className="history-row">
                    <span className={`history-icon ${returned ? 'in' : 'out'}`}>
                      {returned ? <ArrowDownLeft size={14} aria-hidden="true" /> : <ArrowUpRight size={14} aria-hidden="true" />}
                    </span>
                    <div className="history-main">
                      <div>{returned ? 'Returned by' : 'Given to'} <strong>{t.userName}</strong></div>
                      <div className="muted">{t.location.area} · {formatDateTime(t.swappedAt)}</div>
                    </div>
                    {t.status !== 'success' && <Badge tone={TRANSACTION_STATUS[t.status].tone}>{TRANSACTION_STATUS[t.status].label}</Badge>}
                    <ChevronRight size={16} className="history-chevron" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </SidePanel>
  )
}
