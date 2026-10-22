import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { MOCK_NOW, transactions } from '../mock-data'
import type { TransactionStatus } from '../mock-data'
import { token, useTheme } from '../theme/context'

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

export type TimeRange = 'today' | 'week' | 'month'

/** A clicked point: one hour / day bucket on one outcome line. */
export interface ChartSelection {
  start: number
  end: number
  status: TransactionStatus
  title: string
}

const IST_OFFSET = 5.5 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// colours come from the theme's design tokens so the chart follows light / dark mode
const SERIES: { status: TransactionStatus; name: string; colorToken: string }[] = [
  { status: 'success', name: 'Successful', colorToken: '--color-success' },
  { status: 'partial', name: 'Partial', colorToken: '--color-charging' },
  { status: 'failed', name: 'Failed', colorToken: '--color-primary' },
]

const istLabel = (ms: number, opts: Intl.DateTimeFormatOptions) =>
  new Date(ms).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opts })

const dayOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
const weekOptions: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' }
const monthOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

function buildBuckets(range: TimeRange) {
  const now = MOCK_NOW.getTime()
  const todayStart = Math.floor((now + IST_OFFSET) / DAY) * DAY - IST_OFFSET
  const size = range === 'today' ? HOUR : DAY
  const start = range === 'today' ? todayStart : todayStart - (range === 'week' ? 6 : 29) * DAY
  const count = range === 'today' ? 24 : range === 'week' ? 7 : 30

  const labels = Array.from({ length: count }, (_, i) =>
    range === 'today'
      ? istLabel(start + i * size, { ...dayOptions })
      : istLabel(start + i * size, range === 'week' ? weekOptions : monthOptions),
  )
  const counts = Object.fromEntries(SERIES.map((s) => [s.status, Array<number | null>(count).fill(0)]))
  for (const t of transactions) {
    const at = Date.parse(t.swappedAt)
    if (at < start || at > now) continue
    counts[t.status][Math.floor((at - start) / size)]! += 1
  }
  // future hours of today have no data yet — leave them empty instead of drawing zeros
  if (range === 'today') {
    const currentHour = Math.floor((now - start) / HOUR)
    for (const s of SERIES) for (let i = currentHour + 1; i < count; i++) counts[s.status][i] = null
  }
  const title = (i: number) => {
    const from = start + i * size
    return range === 'today'
      ? `Today · ${istLabel(from, dayOptions)}–${istLabel(from + size, dayOptions)}`
      : istLabel(from, { weekday: 'long', day: 'numeric', month: 'short' })
  }
  return { labels, counts, start, size, title }
}

interface SwapTimelineChartProps {
  range: TimeRange
  onPointClick?: (selection: ChartSelection) => void
}

export default function SwapTimelineChart({ range, onPointClick }: SwapTimelineChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const buckets = useMemo(() => buildBuckets(range), [range])
  const { labels, counts } = buckets
  const { theme } = useTheme()

  // the click handler is bound once; these refs give it the latest values
  const latest = useRef({ buckets, onPointClick })
  const hiddenSeries = useRef(new Set<string>())
  useEffect(() => {
    latest.current = { buckets, onPointClick }
  }, [buckets, onPointClick])

  useEffect(() => {
    const chart = echarts.init(ref.current!)
    chartRef.current = chart
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(ref.current!)

    chart.on('legendselectchanged', (e) => {
      const { selected } = e as { selected: Record<string, boolean> }
      hiddenSeries.current = new Set(Object.keys(selected).filter((name) => !selected[name]))
    })

    // clicking anywhere in the plot picks the bucket under the cursor and the visible line nearest to it
    chart.getZr().on('click', ({ offsetX, offsetY }) => {
      const { buckets: b, onPointClick: cb } = latest.current
      if (!cb || !chart.containPixel('grid', [offsetX, offsetY])) return
      const index = Math.round(chart.convertFromPixel({ xAxisIndex: 0 }, offsetX) as number)
      const y = chart.convertFromPixel({ yAxisIndex: 0 }, offsetY) as number
      const candidates = SERIES.filter((s) => !hiddenSeries.current.has(s.name) && (b.counts[s.status][index] ?? 0) > 0)
      if (candidates.length === 0) return
      const nearest = candidates.reduce((a, c) =>
        Math.abs(b.counts[c.status][index]! - y) < Math.abs(b.counts[a.status][index]! - y) ? c : a,
      )
      const start = b.start + index * b.size
      cb({ start, end: start + b.size, status: nearest.status, title: b.title(index) })
    })

    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [])

  useEffect(() => {
    const muted = token('--color-ink-muted')
    const ink = token('--color-ink')
    chartRef.current?.setOption(
      {
        textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: muted },
        tooltip: {
          trigger: 'axis',
          backgroundColor: token('--tooltip-bg'),
          borderColor: token('--color-border'),
          textStyle: { color: token('--tooltip-ink') },
        },
        legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: ink } },
        grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: labels,
          axisLine: { lineStyle: { color: token('--color-border') } },
          axisTick: { show: false },
          axisLabel: { color: muted, hideOverlap: true },
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          splitLine: { lineStyle: { color: token('--chart-grid') } },
          axisLabel: { color: muted },
        },
        series: SERIES.map((s) => {
          const color = token(s.colorToken)
          return {
            name: s.name,
            type: 'line',
            smooth: true,
            showSymbol: false,
            symbolSize: 7,
            lineStyle: { width: s.status === 'success' ? 3 : 2, color },
            itemStyle: { color },
            areaStyle:
              s.status === 'success'
                ? {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: echarts.color.modifyAlpha(color, 0.28) },
                    { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
                  ]),
                }
                : undefined,
            emphasis: { focus: 'series' },
            data: counts[s.status],
          }
        }),
      },
      true,
    )
  }, [labels, counts, theme])

  return <div ref={ref} className={`chart${onPointClick ? ' chart-clickable' : ''}`} />
}
