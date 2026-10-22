import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, ChevronRight, MapPin, XCircle } from 'lucide-react'
import { transactions } from '../mock-data'
import { useLastDefined } from '../hooks/useLastDefined'
import { TRANSACTION_STATUS, FAILURE_LABEL, formatTime } from '../utils/format'
import SidePanel from './SidePanel'
import type { ChartSelection } from './SwapTimelineChart'

const TONE_VAR = { success: 'var(--color-success)', warning: 'var(--color-charging)', danger: 'var(--color-danger)' } as const
const STATUS_ICON = { success: ArrowLeftRight, partial: AlertTriangle, failed: XCircle } as const

interface TransactionsPanelProps {
  selection: ChartSelection | null
  onClose: () => void
}

export default function TransactionsPanel({ selection, onClose }: TransactionsPanelProps) {
  const shown = useLastDefined(selection)

  const list = useMemo(() => {
    if (!shown) return []
    return transactions
      .filter((t) => {
        const at = Date.parse(t.swappedAt)
        return t.status === shown.status && at >= shown.start && at < shown.end
      })
      .reverse()
  }, [shown])

  const summary = useMemo(
    () => ({
      batteries: list.reduce((n, t) => n + t.swapCount, 0),
      stations: new Set(list.map((t) => t.stationId)).size,
      users: new Set(list.map((t) => t.userId)).size,
    }),
    [list],
  )

  const status = shown && TRANSACTION_STATUS[shown.status]
  const tone = status ? TONE_VAR[status.tone as keyof typeof TONE_VAR] : undefined

  return (
    <SidePanel
      open={selection !== null}
      onClose={onClose}
      label="Transactions"
      icon={shown ? STATUS_ICON[shown.status] : undefined}
      tone={tone}
      title={status && `${status.label} swaps`}
      subtitle={shown?.title}
    >
      <div className="panel-summary">
        <div><strong>{list.length}</strong><span>Transactions</span></div>
        <div><strong>{summary.batteries}</strong><span>Batteries swapped</span></div>
        <div><strong>{summary.stations}</strong><span>Stations</span></div>
        <div><strong>{summary.users}</strong><span>Riders</span></div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Transactions <span>newest first</span></h3>
        <ul className="panel-list">
          {list.map((t) => (
            <li key={t.id}>
              <Link to={`/transactions/details/${t.id}`} className="txn-row">
                <span className="txn-time">{formatTime(t.swappedAt)}</span>
                <div className="txn-main">
                  <div className="txn-user">{t.userName}</div>
                  <div className="txn-meta">
                    <MapPin size={12} aria-hidden="true" />
                    {t.location.area}, {t.location.city}
                  </div>
                  {t.failureReason && <div className="txn-reason">{FAILURE_LABEL[t.failureReason]}</div>}
                </div>
                <div className="txn-side">
                  <span className="txn-id">{t.id}</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SidePanel>
  )
}
