import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { createUserClient, type UserClient } from '../lib/supabase.js'

export interface AppEnv {
  Variables: {
    userId: string
    supabase: UserClient
  }
}

/**
 * Authorization 헤더의 Supabase JWT를 검증하고 user_id 를 컨텍스트에 주입한다.
 * 로그인 자체는 Supabase Auth가 담당하므로 여기서 인증 로직을 구현하지 않는다.
 *
 * 검증은 Supabase에 getUser 를 물어보는 방식이다. 서명 검증을 직접 하려면
 * JWKS 캐싱이 필요한데, 무상태 함수에서 관리 대상을 늘리는 것보다 왕복 한 번이 낫다고 판단했다.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization')

  if (!header?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: '로그인이 필요해요.' })
  }

  const supabase = createUserClient(header.slice('Bearer '.length))
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new HTTPException(401, { message: '세션이 만료됐어요. 다시 로그인해주세요.' })
  }

  c.set('userId', data.user.id)
  c.set('supabase', supabase)

  await next()
})
