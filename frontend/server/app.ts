import { Hono } from 'hono'

/**
 * Hono 앱 본체. Vercel 진입점(api/[[...route]].ts)에서 이 앱을 그대로 넘겨받는다.
 * 모든 라우트는 /api 아래에 붙으므로 여기서 basePath를 한 번만 지정한다.
 */
const app = new Hono().basePath('/api')

app.get('/health', (c) => c.json({ ok: true }))

export default app
