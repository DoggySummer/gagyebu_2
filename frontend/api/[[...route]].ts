import { handle } from 'hono/vercel'
import app from '../server/app.ts'

// 라우트 파일을 쪼개지 않고 이 catch-all 하나로 받는다.
// 서버리스 함수가 1개로 유지되고, 경로 분기는 Hono가 담당한다.
export const config = {
  runtime: 'nodejs',
}

export default handle(app)
