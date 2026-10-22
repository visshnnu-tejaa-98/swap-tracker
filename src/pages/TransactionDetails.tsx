import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, BatteryCharging, BatteryFull, CheckCircle2, Clock, CreditCard, DoorOpen,
  Mail, MapPin, Phone, PlugZap, Radio, Undo2, User as UserIcon, Wifi, XCircle, Zap, type LucideIcon,
} from 'lucide-react'
import Badge from '../components/Badge'
import { getBatteryById, getStationById, getTransactionById, getUserById, getUserByTransactionId, type Battery, type TransactionStep } from '../mock-data'
import {
  BATTERY_CONDITION, BATTERY_STATUS, FAILURE_LABEL, STEP_LABEL, TRANSACTION_STATUS,
  formatDate, formatDateTime, formatDuration, formatTime, titleCase,
} from '../utils/format'

const STEP_ICON: Record<TransactionStep['step'], LucideIcon> = {
  authenticate: Radio,
  collect: DoorOpen,
  dispense: BatteryFull,
  return: Undo2,
  complete: CheckCircle2,
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function BatteryCard({ battery, kind, step }: { battery: Battery; kind: 'in' | 'out'; step?: TransactionStep }) {
  const status = BATTERY_STATUS[battery.status]
  const condition = BATTERY_CONDITION[battery.condition]
  const usedPct = (battery.chargingCyclesCompleted / battery.supportedChargingCycles) * 100
  const where =
    battery.location.type === 'station'
      ? `${getStationById(battery.location.stationId)?.name.replace(/^Zeno | Swap Station$/g, '')} · door ${battery.location.doorNumber}`
      : `Scooter ${battery.location.scooterId} · ${getUserById(battery.location.userId)?.name}`

  return (
    <div className={`battery-card battery-${kind}`}>
      <div className="battery-head">
        <span className="battery-kind">{kind === 'in' ? 'Returned by user' : 'Given to user'}</span>
        <span className="battery-id">{battery.batteryId}</span>
      </div>

      <div className="battery-section-label">At swap</div>
      <div className="battery-at-swap">
        <div>
          <DoorOpen size={14} aria-hidden="true" /> Door <strong>{step?.door ?? '—'}</strong>
        </div>
        <div className="charge">
          <span className="charge-bar"><span style={{ width: `${step?.chargeLevel ?? 0}%` }} /></span>
          <strong>{step?.chargeLevel ?? '—'}%</strong>
        </div>
      </div>

      <div className="battery-section-label">Current status</div>
      <div className="battery-badges">
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone={condition.tone}>{condition.label}</Badge>
      </div>
      <dl className="fields fields-2">
        <Field label="Health">
          <span className="meter-inline"><span className="meter"><span style={{ width: `${battery.health}%` }} /></span>{battery.health}%</span>
        </Field>
        <Field label="Charge">{battery.chargeLevel}%</Field>
        <Field label="Cycles">
          {battery.chargingCyclesCompleted.toLocaleString('en-IN')} / {battery.supportedChargingCycles.toLocaleString('en-IN')}
          <span className="meter meter-thin"><span style={{ width: `${usedPct}%` }} /></span>
        </Field>
        <Field label="Remaining">{battery.chargingCyclesRemaining.toLocaleString('en-IN')} cycles</Field>
        <Field label="Location">{where}</Field>
        <Field label="Model">{battery.model}</Field>
      </dl>
      {battery.faultReason && (
        <div className="inline-alert">
          <AlertTriangle size={14} aria-hidden="true" /> {titleCase(battery.faultReason)}
        </div>
      )}
    </div>
  )
}

export default function TransactionDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const txn = getTransactionById(id)

  if (!txn) {
    return (
      <div className="page">
        <div className="card placeholder">
          Transaction <strong>{id}</strong> was not found. <Link to="/transactions">Back to transactions</Link>
        </div>
      </div>
    )
  }

  const user = getUserById(txn.userId)
  const station = getStationById(txn.stationId)
  const status = TRANSACTION_STATUS[txn.status]
  const stepFor = (batteryId: string) => txn.steps.find((s) => s.batteryId === batteryId)
  const pairs = txn.insertedBatteryIds.map((inId, i) => ({
    inBattery: getBatteryById(inId)!,
    outBattery: getBatteryById(txn.dispensedBatteryIds[i])!,
  }))
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/transactions'))

  return (
    <div className="page details">
      <button className="back-link" onClick={back}>
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </button>

      <header className={`card details-hero tone-${status.tone}`}>
        <div className="hero-main">
          <div className="hero-icon">
            {txn.status === 'success' ? <Zap size={22} aria-hidden="true" /> : txn.status === 'partial' ? <AlertTriangle size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}
          </div>
          <div>
            <div className="hero-eyebrow">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span>{txn.id}</span>
            </div>
            <h1 className="page-title">{txn.swapCount} of 2 batteries swapped by {getUserByTransactionId(id)?.name}</h1>
            <div className="page-subtitle">
              {txn.userName} at {txn.stationName} · {formatDateTime(txn.swappedAt)}
            </div>
          </div>
        </div>
        <dl className="hero-stats">
          <Field label="Duration"><Clock size={14} aria-hidden="true" /> {formatDuration(txn.durationSeconds)}</Field>
          <Field label="Started">{formatTime(txn.swappedAt, true)}</Field>
          <Field label="Ended">{formatTime(txn.completedAt, true)}</Field>
          <Field label="RFID">{txn.rfid}</Field>
        </dl>
      </header>

      {txn.failureReason && (
        <div className={`alert alert-${status.tone}`}>
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>{FAILURE_LABEL[txn.failureReason]}</strong>
            <span> — {txn.failureMessage}</span>
            {txn.failedAtStep && <span className="alert-meta"> · failed at “{titleCase(txn.failedAtStep)}” step</span>}
            {txn.estimatedWaitMinutes && <span className="alert-meta"> · next charged battery in ~{txn.estimatedWaitMinutes} min</span>}
          </div>
        </div>
      )}

      <div className="details-grid">
        <div className="details-col">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title"><BatteryCharging size={18} aria-hidden="true" />Battery exchange</h2>
            </div>
            {pairs.length === 0 ? (
              <div className="empty-note">No batteries were exchanged in this transaction.</div>
            ) : (
              <div className="exchange-list">
                {pairs.map(({ inBattery, outBattery }, i) => (
                  <div key={inBattery.id} className="exchange">
                    <div className="exchange-label">Battery {i + 1}</div>
                    <div className="exchange-row">
                      <BatteryCard battery={inBattery} kind="in" step={stepFor(inBattery.id)} />
                      <div className="exchange-arrow" aria-hidden="true"><ArrowRight size={18} /></div>
                      <BatteryCard battery={outBattery} kind="out" step={stepFor(outBattery.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <h2 className="card-title"><Clock size={18} aria-hidden="true" />Swap timeline</h2>
            </div>
            <ol className="timeline">
              {txn.steps.map((step, i) => {
                const Icon = step.status === 'failed' ? XCircle : STEP_ICON[step.step]
                return (
                  <li key={i} className={`timeline-item ${step.status}`}>
                    <span className="timeline-dot"><Icon size={14} aria-hidden="true" /></span>
                    <div className="timeline-body">
                      <div className="timeline-title">
                        {step.status === 'failed' ? `${titleCase(step.step)} failed` : STEP_LABEL[step.step]}
                        {step.battery && <span className="muted"> · battery {step.battery}</span>}
                      </div>
                      <div className="timeline-meta">
                        {formatTime(step.at, true)}
                        {step.door && <> · door {step.door}</>}
                        {step.chargeLevel !== undefined && <> · {step.chargeLevel}% charge</>}
                        {step.batteryId && <> · {getBatteryById(step.batteryId)?.batteryId}</>}
                      </div>
                      {step.note && <div className="timeline-note">{step.note}</div>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        <div className="details-col">
          {user && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><UserIcon size={18} aria-hidden="true" />User</h2>
                <Badge tone={user.status === 'active' ? 'success' : 'danger'}>{titleCase(user.status)}</Badge>
              </div>
              <div className="profile">
                <div className="avatar">{user.name.split(' ').map((p) => p[0]).join('')}</div>
                <div>
                  <div className="profile-name">{user.name}</div>
                  <div className="muted">{user.age} yrs · {titleCase(user.gender)} · {user.homeCity}</div>
                </div>
              </div>
              <ul className="contact">
                <li><Phone size={14} aria-hidden="true" />{user.phone}</li>
                <li><Mail size={14} aria-hidden="true" />{user.email}</li>
                <li><CreditCard size={14} aria-hidden="true" />{user.rfidTag}</li>
              </ul>
              <dl className="fields fields-2">
                <Field label="Scooter">{user.scooter.model}</Field>
                <Field label="Registration">{user.scooter.registrationNumber}</Field>
                <Field label="Plan">{titleCase(user.subscription.plan)}{user.subscription.monthlySwapLimit ? ` · ${user.subscription.monthlySwapLimit}/mo` : ''}</Field>
                <Field label="Total swaps">{user.totalSwaps}</Field>
                <Field label="Member since">{formatDate(user.createdAt)}</Field>
                <Field label="Batteries now">{user.batteryIds.map((b) => getBatteryById(b)?.batteryId).join(', ')}</Field>
              </dl>
            </section>
          )}

          {station && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><PlugZap size={18} aria-hidden="true" />Station</h2>
                <Badge tone={station.status === 'online' ? 'success' : station.status === 'offline' ? 'danger' : 'warning'}>{titleCase(station.status)}</Badge>
              </div>
              <div className="profile-name">{station.name}</div>
              <div className="muted station-address">
                <MapPin size={14} aria-hidden="true" />
                {station.location.address}, {station.location.city}, {station.location.state} {station.location.pincode}
              </div>
              <div className="station-counts">
                <div><strong>{station.chargedBatteries}</strong><span>Charged</span></div>
                <div><strong>{station.chargingBatteries}</strong><span>Charging</span></div>
                <div><strong>{station.notWorkingBatteries}</strong><span>Not working</span></div>
                <div><strong>{station.emptyDoors}</strong><span>Empty</span></div>
              </div>
              <div className="door-grid" aria-label="Doors right now">
                {station.doors.map((d) => {
                  const b = d.batteryId ? getBatteryById(d.batteryId) : undefined
                  const usedHere = txn.steps.some((s) => s.door === d.doorNumber)
                  return (
                    <div key={d.doorNumber} className={`door ${b?.status ?? 'empty'}${usedHere ? ' used' : ''}`} title={b ? `${b.batteryId} · ${BATTERY_STATUS[b.status].label}` : 'Empty'}>
                      {d.doorNumber}
                    </div>
                  )
                })}
              </div>
              <div className="muted door-note">Current door state · outlined doors were used in this swap</div>
              <dl className="fields fields-2">
                <Field label="Code">{station.stationCode}</Field>
                <Field label="Connectivity"><Wifi size={13} aria-hidden="true" /> {station.connectivity.toUpperCase()}</Field>
                <Field label="Hours">{station.operatingHours.open}–{station.operatingHours.close}</Field>
                <Field label="Total swaps">{station.totalSwaps}</Field>
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
