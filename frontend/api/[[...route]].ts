import { getRequestListener } from '@hono/node-server'
import app from '../server/app'

// 라우트 파일을 쪼개지 않고 이 catch-all 하나로 받는다.
// 서버리스 함수가 1개로 유지되고, 경로 분기는 Hono가 담당한다.
//
// 주의: 이 파일은 Vercel이 자체 tsc 설정으로 컴파일한다. tsconfig.server.json 은
// 로컬 검사용일 뿐이므로 여기서는 그 설정에 기대는 문법을 쓰지 않는다.
// - import 경로에 .ts 확장자를 붙이지 않는다 (allowImportingTsExtensions 없음)
// - @types/node 가 필요한 타입을 참조하지 않는다 (types: ["node"] 없음)
// - config.runtime 도 지정하지 않는다 (Node가 기본값)
//
// hono/vercel 의 handle 은 Edge 런타임(fetch 시그니처)용이라 Node 런타임의
// (req, res) 호출에서 터진다. fetch 핸들러를 Node 리스너로 변환해 내보낸다.
export default getRequestListener(app.fetch)
