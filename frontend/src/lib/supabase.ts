import { createClient } from '@supabase/supabase-js'
import type { Database } from '@shared/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 가 비어 있습니다. .env.example을 참고해 .env.local을 채우세요.',
  )
}

/**
 * 브라우저용 Supabase 클라이언트. 반드시 이 인스턴스를 재사용한다.
 * 컴포넌트마다 createClient를 호출하면 세션 리스너가 중복 등록된다.
 *
 * Database 제네릭을 붙이면 from('expenses') 같은 호출의 인자와 반환값이 모두 타입 체크된다.
 */
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)
