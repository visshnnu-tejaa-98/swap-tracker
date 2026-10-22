import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, X } from 'lucide-react'
import { transactions } from '../mock-data'
import { TRANSACTION_STATUS, FAILURE_LABEL, formatTime } from '../utils/format'
import Badge from './Badge'
import type { ChartSelection } from './SwapTimelineChart'

interface TransactionsPanelProps {
  selection: ChartSelection | null
  onClose: () => void
}

export default function TransactionsPanel({ selection, onClose }: TransactionsPanelProps) {
  const list = useMemo(() => {
    if (!selection) return []
    return transactions
      .filter((t) => {
        const at = Date.parse(t.swappedAt)
        return t.status === selection.status && at >= selection.start && at < selection.end
      })
      .reverse()
  }, [selection])

  useEffect(() => {
    if (!selection) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selection, onClose])

  const open = selection !== null
  const status = selection && TRANSACTION_STATUS[selection.status]

  // portalled so transformed ancestors (entrance animations) can't trap the fixed panel
  return createPortal(
    <>
      <div className={`panel-backdrop${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`panel${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Transactions" aria-hidden={!open}>
        {selection && status && (
          <>
            <header className="panel-header">
              <div>
                <div className="panel-eyebrow">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <span>{list.length} transaction{list.length === 1 ? '' : 's'}</span>
                </div>
                <h2 className="panel-title">{selection.title}</h2>
              </div>
              <button className="icon-button" onClick={onClose} aria-label="Close">
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <ul className="panel-list">
              {list.map((t) => (
                <li key={t.id}>
                  <Link to={`/transactions/details/${t.id}`} className="txn-row">
                    <div className="txn-time">{formatTime(t.swappedAt)}</div>
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
          </>
        )}
      </aside>
    </>,
    document.body,
  )
}
