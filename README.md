# 가계부 + 감사일기 웹 프로젝트

하루 단위로 감정·감사·기록과 소비 내역을 함께 남기는 개인용 웹 애플리케이션. 모바일 사용을 우선으로 설계.

> 마지막 업데이트: 2026-08-06
> 리포지토리: https://github.com/DoggySummer/gagyebu_2

## 개요

- 핵심 컨셉: **하루 = 하나의 엔트리.** 기분 점수, 감사한 일, 마크다운 자유 기록과 그날의 변동지출을 한 화면에서 관리
- 모바일 퍼스트, 라이트 모드 전용 (다크모드 없음). 종이 다이어리 감성의 아이보리 배경(`#FDFBF7`) 기반 컬러 토큰 사용
- 화면 구조: 하단 탭 3개 — 오늘 / 캘린더 / 더보기(즐겨찾기·통계·설정)
- 로그인 수단은 카카오 소셜 로그인 단일

> 1차(MVP) 기능 설계 상세는 `docs/superpowers/specs/2026-08-03-daily-log-mvp-design.md` 참고

## 프론트엔드

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| Node.js | 24.x (Active LTS) | 개발/빌드 런타임. LTS라 안정적 |
| React | 19.2.x | 프론트엔드 프레임워크 (요구사항) |
| TypeScript | 6.0.x | 타입 안정성 (요구사항) |
| Vite | 8.x | 빠른 빌드/HMR, React+TS 템플릿 즉시 생성 가능 |
| Tailwind CSS | 최신 v4 | 빠른 스타일링, 디자인 토큰을 CSS 변수로 관리 |
| ECharts (echarts-for-react) | 최신 | 지출 통계용 차트 (카테고리별 파이, 월별 추이) |
| supabase-js | 최신 | 카카오 소셜 로그인 처리, 세션 관리, 데이터 조회 |
| React Router | 8.x | 스펙의 URL 구조(`/entries/:date`, `/calendar/:year/:month`)를 그대로 라우트로 옮김. 레이아웃 라우트로 앱 셸과 로그인 가드를 감쌈 |

> AG Grid는 제외함. 모바일 우선 UI에서 하루치 지출을 카드 리스트로 보여주는 구조라 그리드 라이브러리가 불필요하고, 번들 크기만 커짐. 추후 데스크톱 전체 내역 화면을 만들 때 재검토 (2026-08-03)
>
> 캘린더 UI도 서드파티 라이브러리 없이 Tailwind Grid로 직접 구현. 필요한 기능이 월 이동과 날짜 셀 렌더링뿐이라 라이브러리 커스터마이징 비용이 더 큼

## 백엔드

| 기술 | 버전 | 사용 이유 |
|---|---|---|
| Hono | 4.12.x | 초경량(14KB) 웹 프레임워크. Web Standards 기반이라 Vercel Functions에서 그대로 실행 가능, TypeScript 타입 추론 우수 |
| `hono/vercel` 어댑터 | Hono 코어 포함 | Hono 앱을 Vercel 서버리스 함수 핸들러로 변환 |
| TypeScript | 6.0.x | 프론트엔드와 동일 버전. 언어를 통일해 타입 공유 및 컨텍스트 스위칭 비용 감소 |
| supabase-js | 최신 | DB 접근 계층. PostgREST를 통해 HTTP로 질의하므로 서버리스에서 커넥션 관리가 필요 없음 |
| Supabase CLI 생성 타입 (`database.types.ts`) | 최신 | ORM 대신 사용. 실제 DB 스키마에서 타입을 생성해 supabase-js와 결합하면 쿼리·응답이 모두 타입 체크됨 |
| JWT 검증 미들웨어 | Hono 코어 포함 | Supabase Auth가 발급한 JWT를 검증해 `user_id`를 추출. 인증 자체는 Supabase가 담당하므로 로그인 로직을 직접 구현하지 않음 |

> 기존에는 Java + Spring Boot로 구성했으나, 프론트/백엔드 언어를 TypeScript로 통일하기 위해 Hono로 변경함 (2026-08-01)
>
> ORM(Drizzle)도 검토했으나 사용하지 않기로 결정. Supabase를 적극 활용하는 구조에서는 ORM이 스키마 정의를 이중 관리하게 만들고(마이그레이션 vs Drizzle 스키마), supabase-js는 RLS·Auth와 그대로 맞물림. 타입 안정성은 `supabase gen types`로 확보 (2026-08-06)
>
> 별도 백엔드 서버를 띄우지 않고 **프론트엔드 프로젝트 안의 `api/` 서버리스 함수로 배포**함. 상세는 아래 "프로젝트 구조" 참고 (2026-08-06)

## 프로젝트 구조

Vercel 프로젝트의 Root Directory는 `frontend/`. Vercel이 그 아래 `api/` 폴더를 서버리스 함수로 인식한다.

```
frontend/
  api/
    [...route].ts       ← Vercel 진입점. handle(app)만 export
  server/
    app.ts              ← Hono 앱 조립 (basePath('/api'))
    domains/{도메인}/    ← 라우트 · 서비스
    middleware/         ← JWT 검증 → user_id 주입
  shared/               ← 클라이언트·서버 공용 타입 (database.types.ts)
  src/                  ← React 전용 (클라이언트 번들 대상)
    routes.tsx          ← 라우트 정의
    lib/                ← supabase 클라이언트, 날짜 유틸, 카테고리 상수
    domains/{도메인}/    ← 화면 단위 컴포넌트와 훅
    components/         ← 공용 UI (layout/, routing/)
docs/                   ← 설계 문서
```

- **라우트를 파일로 쪼개지 않고 catch-all(`[...route].ts`) 하나로 받는다.** `api/index.ts`만 두면 `/api` 외의 하위 경로가 404가 되고, 라우트마다 파일을 만들면 Hobby 플랜 함수 개수 제한(12개)을 소모하며 콜드 스타트도 함수별로 각각 발생함. 함수는 1개로 두고 경로 분기는 Hono가 담당. **대괄호는 1개**(`[...route].ts`)여야 한다 — `[[...route]].ts`(옵셔널 catch-all, 대괄호 2개)는 Next.js 전용 문법이라 Vercel의 일반 파일시스템 함수 라우팅에서는 세그먼트 1개짜리 경로만 매칭되고 그 이상은 플랫폼 자체 404로 떨어진다 (2026-08-07 발견)
- **서버 코드는 `src/` 밖에 둔다.** `src/`는 Vite의 클라이언트 번들 대상이라, import 한 줄만 잘못 걸려도 서버 전용 키를 쓰는 코드가 브라우저 번들에 포함될 수 있음. 타입 검사도 `tsconfig.app.json`(DOM) / `tsconfig.server.json`(Node)으로 분리
- 함수는 무상태로 동작하므로 인메모리 캐시·크론·웹소켓은 사용 불가. MVP 범위에는 해당 사항 없음

> 프론트와 API가 동일 오리진이라 CORS 설정이 필요 없고, 배포 대상도 Vercel 프로젝트 하나로 끝남

## DB · 인증 · 스토리지

| 항목 | 선택 | 사용 이유 |
|---|---|---|
| DB | Supabase (관리형 PostgreSQL) | 가계부 데이터는 트랜잭션 무결성이 중요해 관계형 DB 선택. 자체 호스팅 대비 백업/보안 패치 부담이 없음 |
| 인증 | Supabase Auth — 카카오 소셜 로그인 | 카카오 OAuth를 직접 구현하는 공수를 없앰. Provider 연결만으로 처리됨. 로그인 수단은 카카오 단일 |
| 마이그레이션 | Supabase CLI (`supabase/migrations/`) | SQL 파일이 스키마의 단일 원본. 로컬 스택과 운영 프로젝트에 동일하게 적용 |
| 타입 | `supabase gen types typescript` | 마이그레이션 적용 후 타입을 재생성해 코드와 스키마의 어긋남을 컴파일 타임에 발견 |
| 접근 제어 | RLS (Row Level Security) | 모든 테이블에 `user_id` 기준 정책을 걸어 DB 레벨에서 타인 데이터 접근 차단 |
| 스토리지 | Supabase Storage (추후) | 사진 첨부는 MVP 범위 밖이지만, 확장 시 같은 프로젝트 안에서 처리 가능 |

> 무료 티어는 7일간 API 요청이 없으면 프로젝트가 일시정지됨. 재개는 대시보드에서 수동 처리

## 데이터 모델

| 테이블 | 주요 컬럼 | 비고 |
|---|---|---|
| `daily_entries` | `mood_score`, `gratitude`, `note_markdown`, `is_favorite` | `unique(user_id, entry_date)` — 하루에 엔트리 하나 |
| `expenses` | `amount`, `category`, `memo`, `payment_method` | `daily_entries`를 FK로 참조하지 않음 |

- 일기와 지출은 **`user_id` + `entry_date`로만 연결**. FK를 걸지 않아 일기 없이 지출만 기록하는 것도 가능
- 지출 카테고리 6개 고정: **식비 / 외식비 / 꾸밈비 / 문화생활 / 구독료 / 건강**
- 캘린더는 4단계 지출 히트맵. 해당 월 최대 지출 기준 상대값으로 단계 계산 (고정비·저축 제외)

## 인프라

| 항목 | 선택 | 사용 이유 |
|---|---|---|
| 프론트엔드 + API 호스팅 | Vercel | Hono가 Web Standards 기반이라 프론트와 API를 한 프로젝트에서 동일 오리진으로 서빙 가능. CORS 설정과 배포 대상 이원화가 사라짐 |
| CI/CD | Vercel Git 연동 | `main` 푸시 시 자동 빌드·배포. 별도 배포 스크립트 불필요 |
| 리포지토리 구조 | 단일 프로젝트 (`frontend/` 하나에 UI + API) | 별도 `backend/` 패키지를 두면 package.json·lock 파일·린트 설정이 이중이 됨. API가 서버리스 함수 한 벌뿐이라 분리 이득이 없어 합침 (2026-08-06) |
| 함수 런타임 | Node.js (Edge 아님) | Edge는 Node API가 없어 라이브러리 선택이 제약됨. 개인용 앱에서 Edge의 지연시간 이점은 체감이 작다고 판단 |

> 기존 계획은 Oracle Cloud Always Free VM + Docker Compose + Caddy 조합이었으나, DB와 인증을 Supabase로 옮기고 나니 VM이 하는 일이 Hono 실행 하나뿐이라 관리 대상만 남는 구조가 됨. Vercel로 통합해 서버 운영 부담을 제거함 (2026-08-03)
>
> 트레이드오프: 서버리스 콜드 스타트로 첫 요청이 다소 느릴 수 있으나, 개인용 앱에서는 체감이 크지 않다고 판단

## 테스팅

이번 프로젝트에서는 **자동화 테스트를 작성하지 않음.** Vitest, Playwright 모두 미사용.

- 혼자 쓰는 개인용 앱이고 MVP 범위가 좁아, 테스트 인프라를 갖추는 비용 대비 얻는 이득이 작다고 판단
- 검증은 로컬 실행(`vercel dev`)과 실제 사용으로 대체
- 기능이 늘어나거나 여러 명이 쓰게 되면 Vitest부터 다시 도입 검토 (2026-08-06)

## MVP 범위 제외

1차 버전에서는 다음을 구현하지 않음: AI 통계 피드백, 여행 기록, 미디어 로그, 고정지출·저축 입력, 사진 첨부, 데스크톱 전용 레이아웃
