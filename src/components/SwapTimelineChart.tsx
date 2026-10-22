import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { MOCK_NOW, transactions } from '../mock-data'
import type { TransactionStatus } from '../mock-data'

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

export type TimeRange = 'today' | 'week' | 'month'

const IST_OFFSET = 5.5 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const SERIES: { status: TransactionStatus; name: string; color: string }[] = [
  { status: 'success', name: 'Successful', color: '#1e9e6a' },
  { status: 'partial', name: 'Partial', color: '#f2a516' },
  { status: 'failed', name: 'Failed', color: '#fd2e19' },
]

const istLabel = (ms: number, opts: any) =>
  new Date(ms).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opts })

const dayOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
const weekOptions = { weekday: 'short', day: 'numeric' }
const monthOptions = { day: 'numeric', month: 'short' }

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
  return { labels, counts }
}

export default function SwapTimelineChart({ range }: { range: TimeRange }) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const { labels, counts } = useMemo(() => buildBuckets(range), [range])

  useEffect(() => {
    const chart = echarts.init(ref.current!)
    chartRef.current = chart
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(ref.current!)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(
      {
        // animationDuration: 300,
        // animationDurationUpdate: 300,
        // animationEasing: 'cubicOut',
        // animationEasingUpdate: 'cubicInOut',
        textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: '#5d7279' },
        tooltip: { trigger: 'axis', backgroundColor: '#1f3a42', borderWidth: 0, textStyle: { color: '#fff' } },
        legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: '#1f3a42' } },
        grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: labels,
          axisLine: { lineStyle: { color: '#e3e8e9' } },
          axisTick: { show: false },
          axisLabel: { color: '#5d7279', hideOverlap: true },
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          splitLine: { lineStyle: { color: '#eef1f2' } },
          axisLabel: { color: '#5d7279' },
        },
        series: SERIES.map((s) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbolSize: 7,
          lineStyle: { width: s.status === 'success' ? 3 : 2, color: s.color },
          itemStyle: { color: s.color },
          areaStyle:
            s.status === 'success'
              ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(30, 158, 106, 0.28)' },
                  { offset: 1, color: 'rgba(30, 158, 106, 0)' },
                ]),
              }
              : undefined,
          emphasis: { focus: 'series' },
          data: counts[s.status],
        })),
      },
      true,
    )
  }, [labels, counts])

  return <div ref={ref} style={{ width: '100%', height: 340 }} />
}
