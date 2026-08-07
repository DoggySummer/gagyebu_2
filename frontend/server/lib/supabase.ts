import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/database.types.js'
import { supabasePublishableKey, supabaseUrl } from '../env.js'

export type UserClient = SupabaseClient<Database>

/**
 * 요청자의 JWT를 그대로 달고 나가는 클라이언트.
 *
 * service_role 키를 쓰지 않는 이유는 그 키가 RLS를 통째로 우회하기 때문이다.
 * 사용자 토큰으로 붙으면 DB가 매 쿼리마다 RLS를 적용하므로, 서버 코드에
 * user_id 조건을 빠뜨려도 남의 데이터가 새지 않는다.
 *
 * 함수가 무상태라 요청마다 새로 만든다. 커넥션이 아니라 HTTP 클라이언트라 비용이 작다.
 */
export function createUserClient(accessToken: string): UserClient {
  return createClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
