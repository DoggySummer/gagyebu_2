import { apiFetch } from '@/lib/api/client'
import type { ExpenseStatsDto } from '@shared/api.types'

export function fetchExpenseStats(year: number, month: number): Promise<ExpenseStatsDto> {
  return apiFetch<ExpenseStatsDto>(`/stats/expenses?year=${year}&month=${month}`)
}
