import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, type LucideIcon } from 'lucide-react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  label: string
  icon?: LucideIcon
  /** CSS colour used for the header icon and tint */
  tone?: string
  title?: ReactNode
  subtitle?: ReactNode
  /** Badges / chips shown under the title */
  meta?: ReactNode
  children?: ReactNode
}

/**
 * Floating right-hand panel. Content stays mounted while it animates out, so callers
 * should keep passing the last item (see useLastDefined) rather than clearing it.
 */
export default function SidePanel({ open, onClose, label, icon: Icon, tone = 'var(--color-primary)', title, subtitle, meta, children }: SidePanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus({ preventScroll: true })
    }
  }, [open, onClose])

  // portalled so transformed ancestors (entrance animations) can't trap the fixed panel
  return createPortal(
    <div className={`panel-layer${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="panel-backdrop" onClick={onClose} />
      <aside className="panel" role="dialog" aria-modal="true" aria-label={label} inert={!open} style={{ '--tone': tone } as CSSProperties}>
        <header className="panel-header">
          {Icon && (
            <span className="panel-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
          )}
          <div className="panel-heading">
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && <div className="panel-subtitle">{subtitle}</div>}
            {meta && <div className="panel-meta">{meta}</div>}
          </div>
          <button ref={closeRef} className="icon-button panel-close" onClick={onClose} aria-label="Close panel" title="Close (Esc)">
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
