import { supabase } from '@/lib/supabase'
import type { ApiErrorBody } from '@shared/api.types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Hono API 호출용 래퍼.
 *
 * 데이터 접근은 전부 이 경로를 지난다. 브라우저에서 supabase-js로 테이블을 직접
 * 건드리지 않는 이유는, 집계·검증 같은 규칙이 화면마다 흩어지는 걸 막기 위해서다.
 * 인증만 supabase-js가 담당하고, 그 세션의 JWT를 서버로 넘긴다.
 *
 * path 는 '/api' 를 제외한 나머지를 넘긴다. 예: '/entries/2026-08-07'
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  if (!accessToken) {
    throw new ApiError(401, 'UNAUTHORIZED', '로그인이 필요해요.')
  }

  let response: Response

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크에 연결할 수 없어요. 잠시 후 다시 시도해주세요.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null

    throw new ApiError(
      response.status,
      body?.error.code ?? 'UNKNOWN',
      body?.error.message ?? '요청을 처리하지 못했어요.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
