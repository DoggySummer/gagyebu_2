import { apiFetch } from '@/lib/api/client'
import type {
  AccountDto,
  AccountRequest,
  AssetsSummaryDto,
  NetWorthSnapshotDto,
} from '@shared/api.types'

export function fetchAssetsSummary(): Promise<AssetsSummaryDto> {
  return apiFetch<AssetsSummaryDto>('/assets/summary')
}

export function fetchNetWorthTrend(): Promise<NetWorthSnapshotDto[]> {
  return apiFetch<NetWorthSnapshotDto[]>('/assets/trend')
}

export function fetchAccount(id: string): Promise<AccountDto> {
  return apiFetch<AccountDto>(`/assets/accounts/${id}`)
}

export function createAccount(body: AccountRequest): Promise<AccountDto> {
  return apiFetch<AccountDto>('/assets/accounts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateAccount(id: string, body: AccountRequest): Promise<AccountDto> {
  return apiFetch<AccountDto>(`/assets/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteAccount(id: string): Promise<void> {
  return apiFetch<void>(`/assets/accounts/${id}`, { method: 'DELETE' })
}
