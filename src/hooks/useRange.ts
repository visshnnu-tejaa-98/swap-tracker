import { useSearchParams } from 'react-router-dom'
import type { TimeRange } from '../components/SwapTimelineChart'

export const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
]

export function useRange() {
  const [params, setParams] = useSearchParams()
  const param = params.get('range')
  const range: TimeRange = RANGES.some((r) => r.value === param) ? (param as TimeRange) : 'week'
  const setRange = (r: TimeRange) => setParams({ range: r }, { replace: true })
  return [range, setRange] as const
}
