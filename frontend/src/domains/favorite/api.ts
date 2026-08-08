import { apiFetch } from '@/lib/api/client'
import type { FavoritesResponse } from '@shared/api.types'

export function fetchFavorites(cursor: string | null): Promise<FavoritesResponse> {
  return apiFetch<FavoritesResponse>(`/favorites${cursor ? `?cursor=${cursor}` : ''}`)
}
