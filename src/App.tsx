import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import TransactionDetails from './pages/TransactionDetails'
import ThemeProvider from './theme/ThemeProvider'

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
    <ThemeProvider>
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/batteries" element={<ComingSoon title="Batteries" />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/details/:id" element={<TransactionDetails />} />
            <Route path="/users" element={<ComingSoon title="Users" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </ThemeProvider>
  )
}
