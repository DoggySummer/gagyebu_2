import { apiFetch } from '@/lib/api/client'
import type {
  WorkFlowDto,
  WorkScreenDetailDto,
  WorkScreenRequest,
  WorkScreensResponse,
} from '@shared/api.types'

export function fetchWorkScreens(cursor: string | null): Promise<WorkScreensResponse> {
  return apiFetch<WorkScreensResponse>(`/work/screens${cursor ? `?cursor=${cursor}` : ''}`)
}

export function fetchWorkScreen(id: string): Promise<WorkScreenDetailDto> {
  return apiFetch<WorkScreenDetailDto>(`/work/screens/${id}`)
}

export function createWorkScreen(body: WorkScreenRequest): Promise<WorkScreenDetailDto> {
  return apiFetch<WorkScreenDetailDto>('/work/screens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateWorkScreen(id: string, body: WorkScreenRequest): Promise<WorkScreenDetailDto> {
  return apiFetch<WorkScreenDetailDto>(`/work/screens/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteWorkScreen(id: string): Promise<void> {
  return apiFetch<void>(`/work/screens/${id}`, { method: 'DELETE' })
}

export function setWorkFlowDone(flowId: string, isDone: boolean): Promise<WorkFlowDto> {
  return apiFetch<WorkFlowDto>(`/work/flows/${flowId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isDone }),
  })
}
