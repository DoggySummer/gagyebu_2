import { apiFetch } from '@/lib/api/client'
import type { ExpenseDto, ExpenseRequest } from '@shared/api.types'

export type { ExpenseDto, ExpenseRequest, PaymentMethod } from '@shared/api.types'

export function createExpense(date: string, body: ExpenseRequest): Promise<ExpenseDto> {
  return apiFetch<ExpenseDto>(`/entries/${date}/expenses`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateExpense(id: string, body: ExpenseRequest): Promise<ExpenseDto> {
  return apiFetch<ExpenseDto>(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch<void>(`/expenses/${id}`, { method: 'DELETE' })
}
