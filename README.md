# 가계부 + 감사일기 웹 프로젝트

하루 단위로 감정·감사·기록과 소비 내역을 함께 남기는 개인용 웹 애플리케이션. 모바일 사용을 우선으로 설계.

> 마지막 업데이트: 2026-08-03

## 프론트엔드

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| Node.js | 24.x (Active LTS) | 개발/빌드 런타임. LTS라 안정적 |
| React | 19.2.x | 프론트엔드 프레임워크 (요구사항) |
| TypeScript | 6.0.x | 타입 안정성 (요구사항) |
| Vite | 8.x | 빠른 빌드/HMR, React+TS 템플릿 즉시 생성 가능 |
| Tailwind CSS | 최신 v4 | 빠른 스타일링, 디자인 토큰을 CSS 변수로 관리 |
| ECharts (echarts-for-react) | 최신 | 지출 통계용 차트 (카테고리별 파이, 월별 추이) |
| supabase-js | 최신 | 카카오 소셜 로그인 처리 및 세션 관리 |

> AG Grid는 제외함. 모바일 우선 UI에서 하루치 지출을 카드 리스트로 보여주는 구조라 그리드 라이브러리가 불필요하고, 번들 크기만 커짐. 추후 데스크톱 전체 내역 화면을 만들 때 재검토 (2026-08-03)

## 백엔드

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| Hono | 4.12.x | 초경량(14KB) 웹 프레임워크. Web Standards 기반이라 Vercel Functions에서 그대로 실행 가능, TypeScript 타입 추론 우수 |
| TypeScript | 6.0.x | 프론트엔드와 동일 버전. 언어를 통일해 타입 공유 및 컨텍스트 스위칭 비용 감소 |
| Drizzle ORM | 0.45.x | 가볍고 SQL에 가까운 문법, PostgreSQL과 궁합 좋고 타입 안전한 쿼리 작성 가능 |
| postgres.js | 최신 | Drizzle 공식 지원 PostgreSQL 드라이버 중 가장 빠른 드라이버. 서버리스 환경에서는 Supabase 커넥션 풀러(Supavisor, transaction mode) 경유로 연결 |
| JWT 검증 미들웨어 | Hono 코어 포함 | Supabase Auth가 발급한 JWT를 검증해 `user_id`를 추출. 인증 자체는 Supabase가 담당하므로 로그인 로직을 직접 구현하지 않음 |

> 기존에는 Java + Spring Boot로 구성했으나, 프론트/백엔드 언어를 TypeScript로 통일하기 위해 Hono로 변경함 (2026-08-01)

## DB · 인증

| 항목 | 선택 | 사용 이유 |
|---|---|---|
| DB | Supabase (관리형 PostgreSQL) | 가계부 데이터는 트랜잭션 무결성이 중요해 관계형 DB 선택. 자체 호스팅 대비 백업/보안 패치 부담이 없고, Drizzle ORM으로 그대로 연결 가능 |
| 인증 | Supabase Auth — 카카오 소셜 로그인 | 카카오 OAuth를 직접 구현하는 공수를 없앰. Provider 연결만으로 처리됨. 로그인 수단은 카카오 단일 |
| 커넥션 관리 | Supavisor 풀러 (transaction mode) | 서버리스 함수는 요청마다 커넥션을 열어 고갈되기 쉬움. 풀러를 경유해 방지 |

> 무료 티어는 7일간 API 요청이 없으면 프로젝트가 일시정지됨. 재개는 대시보드에서 수동 처리

## 인프라

| 항목 | 선택 | 사용 이유 |
|---|---|---|
| 프론트엔드 + API 호스팅 | Vercel | Hono가 Web Standards 기반이라 프론트와 API를 한 프로젝트에서 동일 오리진으로 서빙 가능. CORS 설정과 배포 대상 이원화가 사라짐 |
| CI/CD | Vercel Git 연동 | `main` 푸시 시 자동 빌드·배포. 별도 배포 스크립트 불필요 |
| 리포지토리 구조 | 모노레포 (frontend/, backend/) | 혼자 개발하며 API 변경을 한 커밋으로 관리하는 게 유리 |

> 기존 계획은 Oracle Cloud Always Free VM + Docker Compose + Caddy 조합이었으나, DB와 인증을 Supabase로 옮기고 나니 VM이 하는 일이 Hono 실행 하나뿐이라 관리 대상만 남는 구조가 됨. Vercel로 통합해 서버 운영 부담을 제거함 (2026-08-03)
>
> 트레이드오프: 서버리스 콜드 스타트로 첫 요청이 다소 느릴 수 있으나, 개인용 앱에서는 체감이 크지 않다고 판단

## 테스팅

| 영역 | 툴 | 버전 | 사용 이유 |
|---|---|---|---|
| 프론트 단위/컴포넌트 테스트 | Vitest + React Testing Library | Vitest 4.x | Vite 네이티브라 빌드 설정 재사용, Jest 대비 빠름 |
| 프론트 E2E | Playwright | 1.62.x | 멀티 브라우저 지원, TypeScript 친화적, Cypress 대비 안정적. 모바일 뷰포트 에뮬레이션으로 반응형 검증 |
| 백엔드 단위/통합 테스트 | Vitest | 4.x | 프론트와 동일 도구로 통일, 테스트 러너 하나로 유지보수 부담 감소 |
| 백엔드 DB 통합 테스트 | Supabase CLI 로컬 스택 | 최신 | 운영과 동일한 Postgres 스키마·마이그레이션으로 로컬에서 검증 |
