import { getRequestListener } from '@hono/node-server'
import app from '../server/app.ts'

// 라우트 파일을 쪼개지 않고 이 catch-all 하나로 받는다.
// 서버리스 함수가 1개로 유지되고, 경로 분기는 Hono가 담당한다.
//
// runtime은 지정하지 않는다. Vercel의 config.runtime 은 'edge' 또는 'nodejs20.x'
// 같은 버전 포함 형식을 받는데, Node 런타임은 어차피 기본값이라 생략하는 편이 안전하다.
//
// hono/vercel 의 handle 은 Edge 런타임(fetch 시그니처)용이라 Node 런타임의
// (req, res) 호출에서 터진다. fetch 핸들러를 Node 리스너로 변환해 내보낸다.
export default getRequestListener(app.fetch)
