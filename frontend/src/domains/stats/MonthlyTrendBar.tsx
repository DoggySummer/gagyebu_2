import ReactECharts from 'echarts-for-react'
import type { MonthlyExpenseTotalDto } from '@shared/api.types'

export function MonthlyTrendBar({ items }: { items: MonthlyExpenseTotalDto[] }) {
  const hasData = items.some((item) => item.total > 0)

  const option = {
    grid: { left: 8, right: 8, top: 16, bottom: 24, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (params: { name: string; value: number }[]) => `${params[0].name}: ${params[0].value.toLocaleString('ko-KR')}원` },
    xAxis: {
      type: 'category',
      data: items.map((item) => `${Number(item.month.slice(5, 7))}월`),
      axisLine: { lineStyle: { color: '#ECE6DC' } },
      axisLabel: { color: '#8A8271', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: { show: false },
    series: [
      {
        type: 'bar',
        data: items.map((item) => item.total),
        itemStyle: { color: '#2B2A26', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
      },
    ],
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <p className="text-content font-semibold text-ink">월별 변동지출 추이</p>

      {hasData ? (
        <ReactECharts option={option} style={{ height: 180 }} />
      ) : (
        <p className="mt-6 text-center text-content text-placeholder">
          최근 6개월간 기록된 지출이 없어요.
        </p>
      )}
    </div>
  )
}
