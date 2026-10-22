import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/batteries', label: 'Batteries' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/users', label: 'Users' },
]

function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="card placeholder">This page is coming soon.</div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">Z</div>
            <div>
              <div className="brand-name">ZENO</div>
              <div className="brand-sub">Swap Tracker</div>
            </div>
          </div>
          <nav className="nav">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/batteries" element={<ComingSoon title="Batteries" />} />
            <Route path="/transactions" element={<ComingSoon title="Transactions" />} />
            <Route path="/users" element={<ComingSoon title="Users" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
