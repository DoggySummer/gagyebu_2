import { apiFetch } from '@/lib/api/client'
import type {
  DailyEntryDto,
  DailyLogDto,
  UpdateEntryRequest,
  UpdateFavoriteRequest,
} from '@shared/api.types'

export type { DailyEntryDto, DailyLogDto, ExpenseDto } from '@shared/api.types'

export function fetchDailyLog(date: string): Promise<DailyLogDto> {
  return apiFetch<DailyLogDto>(`/entries/${date}`)
}

export function saveEntry(date: string, body: UpdateEntryRequest): Promise<DailyEntryDto> {
  return apiFetch<DailyEntryDto>(`/entries/${date}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function setFavorite(date: string, isFavorite: boolean): Promise<DailyEntryDto> {
  const body: UpdateFavoriteRequest = { isFavorite }

  return apiFetch<DailyEntryDto>(`/entries/${date}/favorite`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
