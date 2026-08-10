import type { ExpenseStatsDto } from '@shared/api.types'

export function SavingsRateCard({ stats }: { stats: ExpenseStatsDto }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <p className="text-label text-muted">저축률</p>

      {stats.savingsRate === null ? (
        <p className="mt-1.5 text-content text-placeholder">
          {stats.income === 0 ? '수입을 설정하면 계산돼요' : '자산 기록이 더 쌓이면 계산돼요'}
        </p>
      ) : (
        <p className="mt-1.5 text-amount font-bold text-ink">
          {(stats.savingsRate * 100).toFixed(1)}
          <span className="ml-1 text-content font-semibold text-muted">%</span>
        </p>
      )}
    </div>
  )
}
