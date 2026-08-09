# 순자산(자산/부채) 관리 기능 설계

## 배경

사용자가 개인적으로 쓰던 자산관리 스프레드시트(`내자산포트폴리오.xlsx`)를 프로젝트에 이식하고 싶어함. 시트는 3개 탭으로 구성:

1. **현금흐름** — 월간 수입/고정지출/변동지출/저축(비소비) 예산표, 목표예산 대비 실적
2. **재무상태** — 자산(현금성·투자·은퇴·사용자산) vs 부채(카드·신용·주거·담보·기타대출) 스냅샷, 순자산 집계
3. **계좌 정리** — 은행/증권사별 계좌 잔액과 용도 리스트

세 탭을 한 스펙으로 묶기엔 범위가 너무 넓어(예산 계획, 순자산 추적, 계좌 관리는 서로 독립적인 기능) 단계적으로 나누기로 함:

- **이번 스펙**: 재무상태 + 계좌 정리 → **순자산/계좌 관리** 기능
- **다음 스펙**: 현금흐름 → 수입·고정지출·변동지출 계획 기능 (별도 설계 예정)

현재 `CLAUDE.md`는 "고정지출·저축 입력"을 MVP 범위 밖으로 명시하고 있었으나, 이번 기능 추가로 순자산/계좌 관리는 범위에 포함된다. 현금흐름(예산 계획)은 여전히 범위 밖이며 다음 스펙에서 다룬다.

## 목표

- 은행/증권 계좌와 부채를 등록해서 순자산(자산 총액 − 부채 총액)을 자동 계산
- 월별로 순자산 스냅샷을 남겨서 추이 그래프로 증감을 확인
- 계좌 잔액은 은행 앱을 확인할 때마다 자유로운 주기로 갱신 — 매일 기록해야 하는 게 아님

## 범위 밖

- 현금흐름(수입, 고정지출/변동지출 계획, 저축 목표) — 다음 스펙
- 계좌 뒷자리 등 계좌 식별 정보 — 예산 앱에 불필요한 민감정보라 제외
- 오픈뱅킹 등 자동 계좌 연동 — 시트와 동일하게 수동 입력만
- 계좌별 개별 잔액 이력(계좌 단위 월별 추이) — 이번엔 전체 순자산 추이만

## 데이터 모델

### `accounts`

계좌 정리 탭과 재무상태 탭을 하나의 테이블로 합친다. 두 탭이 원래 같은 데이터를 이중 관리하고 있었기 때문에(계좌 잔액 합계를 수기로 재무상태 총액과 맞춰야 함), 단일 테이블에서 대분류별 합산 뷰로 재무상태를 구성한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK, RLS 기준 |
| `name` | text | 계좌/항목 이름 (예: "생활비 통장") |
| `institution` | text \| null | 기관명 (예: "신한은행"), 선택 입력 |
| `category` | text | 아래 9종 카테고리 중 하나 (CHECK 제약) |
| `balance` | integer | 원 단위, 0 이상 (부채도 양수로 입력) |
| `sort_order` | integer | 목록 정렬 순서 |
| `created_at` / `updated_at` | timestamptz | |

**카테고리 (9종 고정, `src/lib/assetCategories.ts`에서 관리)**

- 자산: 현금성자산 / 투자자산 / 은퇴자산 / 사용자산
- 부채: 카드대출 / 신용대출 / 주거관련대출 / 담보대출 / 기타대출

시트의 부채 하위 세분류(할부금/리볼빙/현금서비스 등)는 옮기지 않는다 — 계좌 `name`에 자유롭게 적으면 되고, 대분류 하나로 충분히 집계할 수 있다.

각 카테고리가 자산인지 부채인지는 DB 컬럼이 아니라 코드 상수(`ASSET_CATEGORIES`, `LIABILITY_CATEGORIES` 배열)로 판별한다. `expenses.category`가 이미 이런 방식(고정 목록 + 코드 상수)을 쓰고 있어 동일 패턴을 따른다.

### `net_worth_snapshots`

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK |
| `month` | date | 해당 월 1일 (예: `2026-08-01`) |
| `asset_total` | integer | 그 시점 자산 총액 |
| `liability_total` | integer | 그 시점 부채 총액 |
| `net_worth` | integer | `asset_total - liability_total` |
| `created_at` / `updated_at` | timestamptz | |

`unique(user_id, month)` 제약. `daily_entries`의 `unique(user_id, entry_date)`와 같은 패턴 — 한 달에 하나의 스냅샷만 존재.

**자동 upsert**: 계좌를 생성/수정/삭제할 때마다 서비스 레이어가 현재 시점 기준 전체 계좌를 재집계해서 이번 달(`date_trunc('month', now())`) 스냅샷 행을 upsert한다. 사용자가 별도로 "저장"이나 "월 마감" 버튼을 누를 필요가 없다.

- 이번 달 안에서 여러 번 수정해도 그 달 스냅샷은 마지막 값으로만 덮어써진다.
- 지난달 스냅샷은 이번 달 수정으로 바뀌지 않는다 — 자연스럽게 얼어붙는다.
- 계좌를 삭제해도 과거 스냅샷은 총액만 저장돼 있어 영향받지 않는다 — 히스토리가 보존된다.

### RLS

두 테이블 모두 RLS 활성화, `user_id = auth.uid()` 정책으로 조회/쓰기 제한. 기존 `expenses` 테이블과 동일한 방어 방식.

## API (`server/domains/assets/`)

화면 단위 응답을 반환하는 기존 컨벤션(`useWorkScreen`의 `screen` 패턴)을 따라, 프론트가 매번 합계를 다시 계산하지 않도록 백엔드가 집계까지 포함해서 내려준다.

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/assets/summary` | `{ accounts: Account[], assetTotal, liabilityTotal, netWorth }` |
| `POST` | `/api/assets/accounts` | 계좌 생성 (스냅샷 자동 upsert) |
| `PATCH` | `/api/assets/accounts/:id` | 계좌 수정 (스냅샷 자동 upsert) |
| `DELETE` | `/api/assets/accounts/:id` | 계좌 삭제 (스냅샷 자동 upsert) |
| `GET` | `/api/assets/trend` | `NetWorthSnapshot[]`, month 오름차순 — 추이 그래프용 |

DTO는 `shared/api.types.ts`에 `Account`, `NetWorthSnapshot`, `AssetsSummary` camelCase 타입으로 추가. DB 로우 타입과 분리.

## 프론트엔드

### 화면 구성

시트처럼 3개로 쪼개지 않고 한 화면(`AssetsPage`)에 요약 + 그래프 + 목록을 모두 담는다. 더보기 메뉴에서 진입하는 화면 자체가 "자산 현황 확인"이라는 하나의 행위이므로 여러 화면으로 나눌 필요가 없다.

**`src/domains/assets/AssetsPage.tsx`** (`/assets`, 탭바 있음)
- 헤더: "자산" 타이틀 + "+ 계좌 추가" 칩 버튼 (→ `/assets/new`)
- 순자산 요약 카드: 순자산 큰 숫자(`text-amount`) + 자산총액/부채총액 2칸
- 순자산 추이 카드: 최근 몇 개월 순자산을 잇는 라인 차트. 서드파티 차트 라이브러리 없이 SVG `polyline`로 직접 그린다 (캘린더 히트맵과 동일한 원칙 — 서드파티 라이브러리 미사용)
- 계좌 목록: 대분류별로 그룹핑, 그룹 헤더에 소계 표시, 그룹 안이 비어있으면 "등록된 계좌가 없어요." 안내
- 계좌 행 클릭 → `/assets/:id/edit`

**`src/domains/assets/AccountFormPage.tsx`** (`/assets/new`, `/assets/:id/edit`, 탭바 없이 단독 — `work/new`와 동일 패턴)
- 필드: 이름(필수), 기관명(선택), 대분류(select, 9종), 잔액(숫자, 0 이상)
- 수정 화면에는 삭제 버튼 포함 (work 상세 화면과 동일한 확인 다이얼로그 패턴)

### 지원 파일

- `src/lib/assetCategories.ts` — `ASSET_CATEGORIES`, `LIABILITY_CATEGORIES`, 합친 `ALL_CATEGORIES`, 카테고리→자산/부채 판별 헬퍼
- `src/domains/assets/api.ts` — `apiFetch` 래퍼
- `src/domains/assets/useAssets.ts` — summary/trend 조회 + 생성/수정/삭제 액션을 묶은 훅 (`useWorkScreen` 패턴)
- `src/domains/assets/NetWorthTrendChart.tsx` — SVG 라인 차트 컴포넌트

### 색상

새 테마 토큰을 추가하지 않는다. 요약 카드의 자산/부채 강조는 기존 `cat-health-bg/fg`(초록, 자산)와 `cat-food-bg/fg`(주황, 부채)를 재사용한다. 계좌 목록 행과 그룹 헤더는 `ink`/`muted`/`surface`/`hairline` 등 기존 중립 토큰만 사용 — 대분류 9종에 별도 색을 부여하지 않는다.

### 내비게이션

`src/domains/more/MorePage.tsx`의 메뉴 배열에 "자산" 항목 추가, 즐겨찾기와 통계 사이에 배치:

```
캘린더 → 즐겨찾기 → 자산 → 통계 → 설정
```

`src/routes.tsx`에 `/assets`(탭바 있는 그룹), `/assets/new`, `/assets/:id/edit`(탭바 없는 단독 그룹, `work/new`와 같은 위치) 라우트 추가.

## 에러 처리 및 엣지 케이스

- 잔액은 0 이상 정수만 입력받는다. 음수 불가 — 부채도 양수로 입력해서 부채 총액에서 차감하는 방식이라 음수가 필요 없다.
- 계좌가 하나도 없으면 요약 카드는 전부 0원, 추이 그래프는 "아직 기록이 없어요" 같은 빈 상태 문구를 보여준다.
- 계좌 생성/수정/삭제 API가 스냅샷 upsert까지 한 트랜잭션으로 처리 — 스냅샷 upsert 실패 시 계좌 변경 자체도 롤백해서 데이터 불일치를 막는다.
- 계좌 삭제는 과거 스냅샷 총액에 영향을 주지 않는다(스냅샷은 계좌 FK 없이 총액만 저장).

## 테스트

프로젝트 컨벤션에 따라 자동화 테스트는 작성하지 않는다. 구현 후 로컬에서 계좌 생성/수정/삭제, 대분류별 집계, 월 스냅샷 upsert, 추이 그래프 렌더링을 수동으로 확인한다.
