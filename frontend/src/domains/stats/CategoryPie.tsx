import ReactECharts from 'echarts-for-react'
import { CATEGORY_HEX, type Category } from '@/lib/categories'
import type { CategoryAmountDto } from '@shared/api.types'

/** 카테고리 색은 앱 전체(입력 칩·히트맵과 무관하게 카테고리 자체)에서 통일해서 쓴다. */
export function CategoryPie({ items }: { items: CategoryAmountDto[] }) {
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
        radius: '65%',
        center: ['50%', '42%'],
        label: { show: false },
        data: items.map((item) => ({
          value: item.amount,
          name: item.category,
          itemStyle: { color: CATEGORY_HEX[item.category as Category]?.fg ?? '#ABA391' },
        })),
      },
    ],
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <p className="text-content font-semibold text-ink">카테고리별 지출</p>

      {items.length === 0 ? (
        <p className="mt-6 text-center text-content text-placeholder">
          이 달에는 기록된 지출이 없어요.
        </p>
      ) : (
        <ReactECharts option={option} style={{ height: 240 }} />
      )}
    </div>
  )
}
