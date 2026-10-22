import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePagerProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export default function TablePager({ page, pageSize, total, onPageChange }: TablePagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="table-footer">
      <span className="muted">
        {total === 0 ? 0 : page * pageSize + 1}–{Math.min(total, (page + 1) * pageSize)} of {total}
      </span>
      <div className="pager">
        <button className="icon-button" disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="muted">Page {page + 1} of {pageCount}</span>
        <button className="icon-button" disabled={page >= pageCount - 1} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
