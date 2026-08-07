# 가계부 + 감사일기 웹 프로젝트 - 작업 가이드

> 기술 스택 및 선정 이유는 README.md 참고
> 1차(MVP) 기능 설계는 `docs/superpowers/specs/2026-08-03-daily-log-mvp-design.md` 참고

## 확정 스택 (요약)

React 19 + TypeScript + Tailwind CSS v4 + Vite / Hono / Supabase(DB·Auth·Storage) / Vercel 배포

- **ORM 사용 안 함.** Supabase CLI로 생성한 `database.types.ts`를 supabase-js와 함께 써서 타입 안정성 확보
- **자동화 테스트 작성 안 함.** Vitest, Playwright 모두 미사용
- 인증은 카카오 소셜 로그인 단일. Supabase Auth를 통해 연동
- Supabase는 최대한 적극적으로 활용 (Auth, DB, RLS, 추후 Storage)

## 프로젝트 핵심 규칙

기능을 만들 때 항상 지켜야 하는 결정들:

- **하루 = 하나의 엔트리.** `daily_entries`는 `unique(user_id, entry_date)`
- **일기와 지출은 FK로 묶지 않는다.** `expenses`는 `user_id` + `entry_date`로만 연결 — 일기 없이 지출만 기록할 수 있어야 함
- 지출 카테고리는 6개 고정: 식비 / 외식비 / 꾸밈비 / 문화생활 / 구독료 / 건강
- 화면 구조는 하단 탭 3개: 오늘 / 캘린더 / 더보기(즐겨찾기·통계·설정)
- 캘린더는 서드파티 라이브러리 없이 Tailwind Grid로 직접 구현 — `MonthCalendar`, `DayCell`, `DayDetailPanel`
- 캘린더 히트맵은 4단계. 해당 월 최대 지출 기준 상대값으로 계산하며 고정비·저축은 제외
- **모바일 퍼스트, 라이트 모드 전용.** 다크모드 대응 코드를 넣지 않음. 아이보리 배경(`#FDFBF7`) 기반 컬러 토큰 사용
- **색은 `src/index.css`의 `@theme` 토큰만 쓴다.** 임의 헥스를 컴포넌트에 박지 않는다. `docs/superpowers/specs/assets/2026-08-07-*.html` 목업은 다른 색 체계(`#FAF7EE`/`#F1ECE0`/`#DBA875`)를 쓰므로 **구성만 참고하고 색은 따르지 않는다** (2026-08-07 결정)
- MVP 범위 밖: AI 통계 피드백, 여행 기록, 미디어 로그, 고정지출·저축 입력, 사진 첨부, 데스크톱 전용 레이아웃

## 자주 쓰는 명령어

### 앱 (frontend/ — UI와 API가 한 프로젝트)
| 명령어 | 설명 |
|---|---|
| `npm install` | 의존성 설치 (패키지 매니저는 npm 하나로 통일) |
| `npm run dev` | **개발 시 기본으로 쓰는 명령.** Vite 개발 서버가 `/api`도 Hono로 처리한다 (`vite.config.ts`의 `honoDevServer` 플러그인). 서버 코드도 저장 즉시 반영됨 |
| `vercel dev` | 배포와 동일한 함수 런타임으로 확인하고 싶을 때 |
| `npm run build` | 프로덕션 빌드 (`tsc -b`로 app·node·server 프로젝트 전체 타입 검사 포함) |
| `npm run lint` | ESLint 검사 |
| `npx tsc -b` | 타입만 빠르게 검사 |
| `npm run typecheck:api` | **`api/` 수정 시 필수.** Vercel과 같은 조건(tsconfig 무시 + nodenext)으로 검사 |

### DB
| 명령어 | 설명 |
|---|---|
| `supabase start` | 로컬 Supabase 스택 실행 (PostgreSQL + Auth) |
| `supabase stop` | 로컬 스택 종료 |
| `supabase migration new {이름}` | 새 마이그레이션 SQL 파일 생성 |
| `supabase db push` | 마이그레이션을 원격 프로젝트에 적용 |
| `supabase gen types typescript --local > frontend/shared/database.types.ts` | 스키마 기준 TypeScript 타입 재생성 |

> 스키마를 변경했으면 **마이그레이션 작성 → 적용 → 타입 재생성** 순서를 반드시 지킨다. 타입 파일은 직접 손으로 수정하지 않음
>
> 배포는 `main` 푸시 시 Vercel이 자동 처리. 별도 배포 명령 없음

## 폴더 구조

Vercel 프로젝트의 Root Directory는 `frontend/`. UI와 API가 한 프로젝트 안에 있다.

```
frontend/
  api/[...route].ts     ← Vercel 진입점. handle(app)만 export, 로직 금지
  server/               ← Hono 앱 (서버 전용 코드는 전부 여기)
    app.ts
    domains/{도메인}/
    middleware/
  shared/               ← 클라이언트·서버가 함께 쓰는 타입
    database.types.ts   ← Supabase CLI 생성물, 수동 편집 금지
    api.types.ts        ← API 요청·응답 DTO (camelCase). DB 로우와 분리
  src/                  ← React 전용 (클라이언트 번들 대상)
    routes.tsx          ← 라우트 정의 (RequireAuth → AppShell → 각 화면)
    lib/api/client.ts   ← apiFetch. 모든 데이터 요청이 지나는 단일 통로
    lib/                ← supabase 클라이언트(인증 전용), 날짜 유틸, 카테고리 상수
    domains/{도메인}/    ← 화면 단위 컴포넌트와 훅 (auth, entry, calendar, favorite, stats, settings, more)
    components/         ← 공용 UI (layout/, routing/)
```

- **데이터 접근은 전부 Hono API를 지난다.** `src/`에서 supabase-js로 테이블을 직접 조회·수정하지 않는다. 화면 → `src/lib/api/client.ts`의 `apiFetch` → `/api/*` → `server/domains/*` 순서. 예외는 인증뿐이며, 로그인·로그아웃·세션 구독만 `src/domains/auth/`에서 supabase-js를 직접 쓴다
- **라우트를 파일로 쪼개지 않는다.** 새 엔드포인트는 `server/domains/`에 만들고 `server/app.ts`에서 `app.route(...)`로 붙인다. `api/`에 파일을 추가하는 일은 없음
- **`api/` 아래 파일은 `tsconfig.server.json`이 적용되지 않는다.** Vercel이 자체 tsc 설정(`nodenext`, `@types/node` 없음)으로 컴파일하므로 상대 import는 `../server/app.js`처럼 **`.js` 확장자**를 붙이고, node 타입이나 `config.runtime`을 쓰지 않는다. 수정 후 `npm run typecheck:api`로 확인할 것
- **서버 코드를 `src/` 안에 두지 않는다.** `src/`는 클라이언트 번들 대상이라 서버 전용 키가 브라우저로 새어나갈 수 있음
- 생성된 DB 타입은 클라이언트도 직접 쓰므로 `shared/`에 둔다. 타입은 빌드 시 지워지므로 양쪽에서 import해도 번들에 남지 않음
- import 별칭: `@/*` → `src/*`, `@shared/*` → `shared/*` (`tsconfig.app.json`의 paths + `vite.config.ts`의 alias 양쪽에 등록해야 동작). 서버 코드는 Vercel 번들러의 해석에 의존하지 않도록 `shared/`를 상대경로로 import
- 타입 검사 분리: `tsconfig.app.json`(src·shared, DOM) / `tsconfig.server.json`(api·server·shared, Node). 새 최상위 폴더를 만들면 해당 tsconfig의 `include`에 추가할 것

## 코드 컨벤션

### 프론트엔드
- 포매팅/린트: ESLint + Prettier. 커밋 전 자동 검사 권장 (husky + lint-staged)
- 컴포넌트 파일명: `PascalCase.tsx` (컴포넌트명과 동일)
- 변수/함수: `camelCase`, 컴포넌트/타입: `PascalCase`
- 커스텀 훅: `use{Name}` 규칙 준수
- import는 절대경로 사용 (tsconfig `paths` 설정), 상대경로는 같은 폴더 내에서만 허용
- Supabase 클라이언트는 `src/lib/supabase.ts` 하나만 두고 재사용. 컴포넌트마다 `createClient` 호출 금지 (세션 리스너가 중복 등록됨)
- 환경변수는 `.env.local`에 두고, 새 변수를 추가하면 `.env.example`과 `src/vite-env.d.ts`에도 반영. `VITE_` 접두사가 붙은 값은 브라우저 번들에 그대로 들어가므로 secret 키에는 절대 붙이지 않음

### 백엔드
- 포매팅/린트: ESLint + Prettier (프론트엔드와 동일 설정 공유 권장)
- 패키지 구조: 계층형이 아닌 도메인 기준 패키징 (예: `server/domains/entry`, `server/domains/expense`)
- 라우트(Hono 핸들러) → Service → supabase-js 쿼리 계층 분리. DB 로우 타입(`Database['public']['Tables'][...]`)과 API 응답 타입은 반드시 분리
- 생성된 타입 파일: `shared/database.types.ts` (Supabase CLI가 관리, 수동 편집 금지)
- 함수는 무상태로 동작함. 인메모리 캐시·크론·웹소켓에 의존하는 구현 금지
- 변수/함수: `camelCase`, 타입/인터페이스: `PascalCase`
- 인증: 로그인은 Supabase Auth(카카오)가 담당. 백엔드는 전달받은 JWT를 검증해 `user_id`를 주입하는 미들웨어만 두고, 인증 로직을 직접 구현하지 않음
- 모든 데이터 쿼리에 `user_id` 조건 필수. RLS도 함께 활성화해 이중으로 방어
- `service_role` 키는 클라이언트에 절대 노출하지 않음. 서버 환경변수로만 사용

## Git 컨벤션

### 브랜치 전략
- `main`: 항상 배포 가능한 상태 유지, 실제 운영 서버에 배포되는 브랜치
- 작업은 `feature/기능명`, `fix/버그명`, `chore/작업명` 브랜치를 짧게 따서 작업 후 `main`에 머지
- develop/staging 같은 중간 브랜치는 두지 않음 (혼자 개발 + 짧은 배포 주기)
- 예: `feature/expense-crud`, `fix/login-token-expire`, `chore/pnpm-upgrade`

### 커밋 메시지 컨벤션 (Conventional Commits)
형식: `<type>(<scope>): <subject>`
- type: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `ci`
- scope: `frontend`(`src/`), `backend`(`api/`·`server/`), `infra`, `docs` 중 변경된 영역
- subject: 명령형으로 간결하게

예시:
- `feat(backend): 지출 CRUD API 추가`
- `fix(frontend): 캘린더 히트맵 색 단계 계산 수정`
- `chore(infra): supabase 마이그레이션 설정 추가`

### 머지 방식
- `feature` 브랜치 → PR 생성 → lint 통과 및 Vercel 프리뷰 확인 → `main` 머지 권장
- 급한 수정은 `main`에 바로 커밋 가능 (혼자 쓰는 프로젝트라 유연하게)

### 버전 태깅
- 배포 시점마다 `v0.1.0` 형식의 Semantic Versioning 태그 부여, 롤백/이력 추적용
