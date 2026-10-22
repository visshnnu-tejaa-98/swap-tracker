import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Batteries from './pages/Batteries'
import Dashboard from './pages/Dashboard'
import Stations from './pages/Stations'
import Transactions from './pages/Transactions'
import TransactionDetails from './pages/TransactionDetails'
import ThemeProvider from './theme/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/batteries" element={<Batteries />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/details/:id" element={<TransactionDetails />} />
              <Route path="/stations" element={<Stations />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
