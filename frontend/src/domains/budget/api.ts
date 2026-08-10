import { apiFetch } from '@/lib/api/client'
import type { BudgetDto, UpdateBudgetRequest } from '@shared/api.types'

/** month는 'YYYY-MM' */
export function fetchBudget(month: string): Promise<BudgetDto> {
  return apiFetch<BudgetDto>(`/budget/${month}`)
}

export function saveBudget(month: string, body: UpdateBudgetRequest): Promise<BudgetDto> {
  return apiFetch<BudgetDto>(`/budget/${month}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}
