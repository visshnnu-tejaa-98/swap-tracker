import { Link } from 'react-router-dom'
import { Minimize2 } from 'lucide-react'
import SwapChartCard from '../components/SwapChartCard'
import { useRange } from '../hooks/useRange'

export default function Transactions() {
  const [range] = useRange()
  return (
    <div className="page page-fill">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <div className="page-subtitle">Swap activity across the network</div>
        </div>
      </div>
      <SwapChartCard
        className="chart-card-fill"
        action={
          <Link to={`/?range=${range}`} className="icon-button" aria-label="Back to dashboard" title="Back to dashboard">
            <Minimize2 size={16} aria-hidden="true" />
          </Link>
        }
      />
    </div>
  )
}
