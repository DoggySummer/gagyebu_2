import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ApiErrorBody } from '../shared/api.types.js'
import { logError } from './env.js'
import calendarRoute from './domains/calendar/route.js'
import entryRoute from './domains/entry/route.js'
import expenseRoute from './domains/expense/route.js'
import inbodyRoute from './domains/inbody/route.js'
import reviewRoute from './domains/review/route.js'

/**
 * Hono 앱 본체. Vercel 진입점(api/handler.ts)에서 이 앱을 그대로 넘겨받는다.
 * 모든 라우트는 /api 아래에 붙으므로 여기서 basePath를 한 번만 지정한다.
 */
const app = new Hono().basePath('/api')

app.get('/health', (c) => c.json({ ok: true }))

app.route('/entries', entryRoute)
app.route('/expenses', expenseRoute)
app.route('/calendar', calendarRoute)
app.route('/inbody', inbodyRoute)
app.route('/reviews', reviewRoute)

// 모든 실패 응답을 { error: { code, message } } 한 형태로 통일한다.
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    const body: ApiErrorBody = {
      error: {
        code: error.status === 401 ? 'UNAUTHORIZED' : error.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message: error.message,
      },
    }

    return c.json(body, error.status)
  }

  // Supabase 오류 메시지는 스키마 정보를 담을 수 있어 그대로 노출하지 않는다.
  logError(error)

  const body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: '요청을 처리하지 못했어요.' },
  }

  return c.json(body, 500)
})

app.notFound((c) => {
  const body: ApiErrorBody = {
    error: { code: 'NOT_FOUND', message: '없는 경로예요.' },
  }

  return c.json(body, 404)
})

export default app
