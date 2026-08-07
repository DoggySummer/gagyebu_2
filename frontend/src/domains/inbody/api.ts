import { apiFetch } from '@/lib/api/client'
import type { InbodyRecordDto, InbodyRequest } from '@shared/api.types'

export type { InbodyRecordDto, InbodyRequest } from '@shared/api.types'

export function fetchInbodyRecords(): Promise<InbodyRecordDto[]> {
  return apiFetch<InbodyRecordDto[]>('/inbody')
}

export function saveInbodyRecord(body: InbodyRequest): Promise<InbodyRecordDto> {
  return apiFetch<InbodyRecordDto>('/inbody', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
