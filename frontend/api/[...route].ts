import { getRequestListener } from '@hono/node-server'
import app from '../server/app.js'

// 라우트 파일을 쪼개지 않고 이 catch-all 하나로 받는다.
// 서버리스 함수가 1개로 유지되고, 경로 분기는 Hono가 담당한다.
//
// 파일명은 [...route].ts (대괄호 1개, 필수 catch-all)여야 한다. [[...route]].ts(대괄호 2개,
// 옵셔널 catch-all)는 Next.js 전용 문법이라 Vercel의 일반 파일시스템 함수 라우팅에서는
// 온전히 지원되지 않는다 — /api/health처럼 세그먼트가 1개인 경로는 매칭되지만
// /api/entries/:date처럼 2단계 이상인 경로는 플랫폼 자체 404(X-Vercel-Error: NOT_FOUND,
// 우리 Hono 앱까지 요청이 닿지도 않음)로 떨어진다. 로컬 개발 서버는 이 파일명과 무관하게
// server/app.ts를 직접 불러 쓰므로 이 문제는 Vercel 배포에서만 드러난다 (2026-08-07 발견).
//
// 주의: 이 파일은 Vercel이 자체 tsc 설정으로 컴파일한다. tsconfig.server.json 은
// 로컬 검사용일 뿐이므로 그 설정에 기대는 문법을 여기서 쓰면 배포 빌드가 깨진다.
// - 상대 import 는 확장자를 붙이되 컴파일 결과물 기준인 .js 로 쓴다.
//   (moduleResolution 이 node16 이라 확장자가 필수이고, .ts 는 거부된다.
//    TypeScript 가 ../server/app.js → ../server/app.ts 로 되짚어 찾는다)
// - @types/node 가 필요한 타입을 참조하지 않는다 (types: ["node"] 없음)
// - config.runtime 도 지정하지 않는다 (Node가 기본값)
//
// hono/vercel 의 handle 은 Edge 런타임(fetch 시그니처)용이라 Node 런타임의
// (req, res) 호출에서 터진다. fetch 핸들러를 Node 리스너로 변환해 내보낸다.
export default getRequestListener(app.fetch)
