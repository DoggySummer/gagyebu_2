import { apiFetch } from '@/lib/api/client'
import type { MonthOverviewDto, MonthlyReviewDto, UpdateReviewRequest } from '@shared/api.types'

export function fetchMonthOverview(year: number, month: number): Promise<MonthOverviewDto> {
  return apiFetch<MonthOverviewDto>(`/calendar/overview?year=${year}&month=${month}`)
}

/** month는 'YYYY-MM' */
export function saveReview(month: string, body: UpdateReviewRequest): Promise<MonthlyReviewDto> {
  return apiFetch<MonthlyReviewDto>(`/reviews/${month}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}
