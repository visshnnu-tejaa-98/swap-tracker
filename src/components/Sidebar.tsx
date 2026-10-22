import { NavLink } from 'react-router-dom'
import { ArrowLeftRight, BatteryCharging, LayoutDashboard, PlugZap, Zap, type LucideIcon } from 'lucide-react'
import { batteries, stations, transactions } from '../mock-data'
import ThemeToggle from './ThemeToggle'

const NAV: { to: string; label: string; icon: LucideIcon; count?: number }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/batteries', label: 'Batteries', icon: BatteryCharging, count: batteries.length },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, count: transactions.length },
  { to: '/stations', label: 'Stations', icon: PlugZap, count: stations.length },
]

const online = stations.filter((s) => s.status === 'online').length
const onlinePct = Math.round((online / stations.length) * 100)
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Zap size={18} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
        </div>
        <div>
          <div className="brand-name">ZENO</div>
          <div className="brand-sub">Swap Tracker</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Overview</div>
        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, count }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <span className="nav-icon">
                <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="nav-text">{label}</span>
              {count !== undefined && <span className="nav-count">{compact(count)}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="network-card">
          <div className="network-head">
            <span className="live-dot" />
            Network live
          </div>
          <div className="network-value">
            <strong>{online}</strong> / {stations.length} stations online
          </div>
          <div className="network-meter" role="meter" aria-valuenow={onlinePct} aria-valuemin={0} aria-valuemax={100} aria-label="Stations online">
            <span style={{ width: `${onlinePct}%` }} />
          </div>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
