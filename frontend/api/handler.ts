import { getRequestListener } from '@hono/node-server'
import app from '../server/app.js'

// 이 함수를 모든 /api/* 요청의 목적지로 삼는다. 경로 분기는 Hono가 담당하므로
// 라우트를 파일로 쪼개지 않는다 — 이 파일 하나가 서버리스 함수 1개로 유지된다.
//
// 파일명에 대괄호(catch-all) 문법을 쓰지 않는다. [...route].ts / [[...route]].ts
// 둘 다 시도해봤지만 Vercel의 일반(비-Next.js) 파일시스템 함수 라우팅에서 세그먼트가
// 2개 이상인 경로(/api/entries/:date 등)가 플랫폼 자체 404(X-Vercel-Error: NOT_FOUND,
// 이 함수까지 요청이 닿지도 않음 — 응답에 X-Vercel-Cache 헤더조차 없음)로 떨어졌다.
// 대신 이 파일은 평범한 이름으로 두고, vercel.json의 rewrites가 /api/:path* 를
// 전부 이 파일로 명시적으로 보낸다. Vercel이 이 "여러 API 경로 → 함수 하나" 구성에
// 공식 문서로 권장하는 방식이라 브래킷 파일명 규칙에 기대는 것보다 안정적이다
// (2026-08-07 발견).
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
