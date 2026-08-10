import ReactECharts from 'echarts-for-react'
import type { ExpenseStatsDto } from '@shared/api.types'

interface Props {
  stats: ExpenseStatsDto
}

/**
 * 고정/변동/저축 3분할. 새 강조색을 만들지 않고 기존 토큰만 쓴다 —
 * 고정=chip(회색), 변동=ink(먹색), 저축=건강 카테고리의 초록.
 * 저축은 순자산 증감이라 음수(그 달에 순자산이 줄었을 때)가 나올 수 있는데,
 * 도넛은 음수를 표현할 수 없어 그 경우 조각에서 빼고 문구로만 알린다.
 */
export function SpendingDonut({ stats }: Props) {
  const savingsSlice = stats.savings !== null && stats.savings > 0 ? stats.savings : 0

  const data = [
    { value: stats.fixedTotal, name: '고정지출', itemStyle: { color: '#F5F1EA' } },
    { value: stats.variableTotal, name: '변동지출', itemStyle: { color: '#2B2A26' } },
    { value: savingsSlice, name: '저축', itemStyle: { color: '#4A7C5E' } },
  ].filter((item) => item.value > 0)

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}원 ({d}%)' },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#48453E', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data,
      },
    ],
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <p className="text-content font-semibold text-ink">지출 구성</p>

      {data.length === 0 ? (
        <p className="mt-6 text-center text-content text-placeholder">기록된 내용이 없어요.</p>
      ) : (
        <ReactECharts option={option} style={{ height: 220 }} />
      )}

      {stats.savings !== null && stats.savings <= 0 && (
        <p className="mt-1 text-center text-label text-muted">
          이번 달은 순자산이 {stats.savings === 0 ? '그대로예요' : '줄었어요'}. 저축 조각은 표시하지
          않아요.
        </p>
      )}

      {stats.savings === null && (
        <p className="mt-1 text-center text-label text-muted">
          자산 기록이 2개월 이상 쌓이면 저축 조각도 함께 보여요.
        </p>
      )}
    </div>
  )
}
