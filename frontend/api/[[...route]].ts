import { getRequestListener } from '@hono/node-server'
import app from '../server/app.ts'

// 라우트 파일을 쪼개지 않고 이 catch-all 하나로 받는다.
// 서버리스 함수가 1개로 유지되고, 경로 분기는 Hono가 담당한다.
export const config = {
  runtime: 'nodejs',
}

// hono/vercel 의 handle 은 Edge 런타임(fetch 시그니처)용이라 Node 런타임에서 터진다.
// Node 런타임은 (req, res) 로 호출하므로 fetch 핸들러를 Node 리스너로 변환해 내보낸다.
export default getRequestListener(app.fetch)
