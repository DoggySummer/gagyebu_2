# 순자산/계좌 관리 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 계좌(자산/부채 항목)를 등록하면 대분류별 합계와 순자산이 자동 계산되고, 계좌를 바꿀 때마다 그 달의 순자산 스냅샷이 자동으로 남아 추이 그래프로 볼 수 있게 한다.

**Architecture:** `accounts` 단일 테이블에 자산/부채 항목을 모두 저장하고, 계좌를 만들거나 고치거나 지울 때마다 서비스 레이어가 전체를 재집계해서 `net_worth_snapshots`(월 단위, `unique(user_id, month)`) 행을 upsert한다. 기존 `work` 도메인과 동일하게 route → service → supabase-js 3단 구조를 따른다. 프론트는 요약 화면(`AssetsPage`) 하나 + 입력 폼(`AccountFormPage`) 하나로 구성.

**Tech Stack:** Hono(백엔드 라우트) / supabase-js(DB 접근, RLS로 보호) / React 19 + React Router(프론트) / Tailwind v4(스타일, `@theme` 토큰만 사용) / 서드파티 차트 라이브러리 없이 SVG 직접 렌더링

## Global Constraints

- **자동화 테스트 없음.** Vitest·Playwright 미사용 (`CLAUDE.md`). 각 태스크의 검증은 `npx tsc -b`(app+server+shared 전체 타입체크) 또는 `npm run typecheck:api`(api 전용, nodenext 조건) + `npm run lint`로 대체한다. UI 태스크는 추가로 `npm run dev` 개발 서버에서 브라우저로 직접 확인한다.
- **색상은 `frontend/src/index.css`의 `@theme` 토큰만 사용.** 임의 hex를 컴포넌트에 넣지 않는다.
- **데이터 접근은 전부 Hono API(`/api/*`)를 지난다.** `src/`에서 supabase-js로 테이블을 직접 조회·수정하지 않는다.
- **`api/handler.ts`는 건드리지 않는다.** 새 라우트는 `server/domains/`에 만들고 `server/app.ts`에서 `app.route(...)`로 붙인다.
- **`shared/database.types.ts`는 Supabase CLI 인증이 안 돼 있어 지금까지 전부 손으로 작성해왔다** (파일 상단 주석 참고). 이번에도 같은 방식으로 두 테이블 타입을 손으로 추가한다.
- **이 저장소엔 로컬 `supabase/` 프로젝트가 없다.** 마이그레이션은 SQL 스크립트로 작성해서 사용자가 Supabase Studio SQL Editor에 직접 붙여넣어 실행한다. `supabase` CLI 명령을 실행하는 태스크는 없다.
- import는 절대경로(`@/*`, `@shared/*`) 사용, 같은 폴더 내에서만 상대경로 허용.
- 커밋 메시지는 Conventional Commits (`feat(backend): ...`, `feat(frontend): ...`) 형식을 따른다.

---

## Task 1: DB 스키마 SQL 작성 (사용자가 Supabase Studio에서 직접 적용)

**Files:**
- Create: `docs/superpowers/specs/assets/2026-08-09-net-worth-schema.sql`

**Interfaces:**
- Produces: `public.accounts` 테이블(컬럼: `id, user_id, name, institution, category, balance, created_at, updated_at`), `public.net_worth_snapshots` 테이블(컬럼: `id, user_id, month, asset_total, liability_total, net_worth, created_at, updated_at`, `unique(user_id, month)`). 이후 모든 태스크가 이 두 테이블 이름과 컬럼명을 그대로 참조한다.

- [ ] **Step 1: SQL 파일 작성**

```sql
-- 2026-08-09: 순자산/계좌 관리 기능 — accounts, net_worth_snapshots
-- Supabase Studio > SQL Editor 에 그대로 붙여넣어 실행한다.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  institution text check (institution is null or char_length(institution) between 1 and 100),
  category text not null check (category in (
    '현금성자산', '투자자산', '은퇴자산', '사용자산',
    '카드대출', '신용대출', '주거관련대출', '담보대출', '기타대출'
  )),
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  asset_total integer not null default 0,
  liability_total integer not null default 0,
  net_worth integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index net_worth_snapshots_user_id_idx on public.net_worth_snapshots (user_id);

alter table public.net_worth_snapshots enable row level security;

create policy "net_worth_snapshots_select_own" on public.net_worth_snapshots
  for select using (auth.uid() = user_id);
create policy "net_worth_snapshots_insert_own" on public.net_worth_snapshots
  for insert with check (auth.uid() = user_id);
create policy "net_worth_snapshots_update_own" on public.net_worth_snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "net_worth_snapshots_delete_own" on public.net_worth_snapshots
  for delete using (auth.uid() = user_id);

-- updated_at 자동 갱신. 이미 같은 이름의 함수가 있다면 동일 로직으로 덮어써도 안전하다.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger net_worth_snapshots_set_updated_at
  before update on public.net_worth_snapshots
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2: 사용자에게 실행 요청**

이 태스크는 사용자 확인이 필요하다 — 위 SQL을 Supabase Studio SQL Editor에 붙여넣어 실행해달라고 요청하고, 성공했는지(또는 에러 메시지) 확인받는다. 실행 확인 전에는 Task 2로 넘어가지 않는다.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/assets/2026-08-09-net-worth-schema.sql
git commit -m "feat(infra): 순자산/계좌 관리 DB 스키마 SQL 추가"
```

---

## Task 2: `database.types.ts`에 두 테이블 타입 수동 추가

**Files:**
- Modify: `frontend/shared/database.types.ts:228-230` (`expenses` 블록과 닫는 `}` 사이에 삽입)

**Interfaces:**
- Consumes: Task 1의 `accounts`, `net_worth_snapshots` 컬럼 정의
- Produces: `Tables<'accounts'>`, `Tables<'net_worth_snapshots'>` 타입 — 이후 서비스 레이어가 이 타입으로 supabase-js 쿼리 결과를 받는다.

- [ ] **Step 1: `expenses` 블록 뒤에 두 테이블 타입 추가**

`frontend/shared/database.types.ts`에서 `expenses: { ... Relationships: [] }` 블록(228번째 줄) 바로 뒤, `Tables` 객체를 닫는 `}` 앞에 삽입:

```typescript
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          institution: string | null
          category: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          institution?: string | null
          category: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          institution?: string | null
          category?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          id: string
          user_id: string
          month: string
          asset_total: number
          liability_total: number
          net_worth: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          asset_total?: number
          liability_total?: number
          net_worth?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          asset_total?: number
          liability_total?: number
          net_worth?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npx tsc -b`
Expected: 에러 없이 종료 (기존 코드가 이 타입을 아직 안 쓰므로 그냥 통과해야 함)

- [ ] **Step 3: Commit**

```bash
git add frontend/shared/database.types.ts
git commit -m "feat(backend): accounts, net_worth_snapshots 테이블 타입 추가"
```

---

## Task 3: 백엔드 카테고리 상수

**Files:**
- Create: `frontend/server/lib/assetCategories.ts`

**Interfaces:**
- Produces: `ACCOUNT_CATEGORIES: readonly string[]`, `isAccountCategory(value: string): boolean`, `isLiabilityCategory(category: string): boolean` — Task 5(`validate.ts`)와 Task 6(`service.ts`)에서 그대로 import해서 쓴다.

- [ ] **Step 1: 파일 작성**

```typescript
export const ASSET_CATEGORIES = ['현금성자산', '투자자산', '은퇴자산', '사용자산'] as const

export const LIABILITY_CATEGORIES = [
  '카드대출',
  '신용대출',
  '주거관련대출',
  '담보대출',
  '기타대출',
] as const

export const ACCOUNT_CATEGORIES = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES] as const

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number]

export function isAccountCategory(value: string): value is AccountCategory {
  return (ACCOUNT_CATEGORIES as readonly string[]).includes(value)
}

export function isLiabilityCategory(category: string): boolean {
  return (LIABILITY_CATEGORIES as readonly string[]).includes(category)
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npm run typecheck:api`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/server/lib/assetCategories.ts
git commit -m "feat(backend): 계좌 대분류 상수 추가"
```

---

## Task 4: `shared/api.types.ts`에 DTO 추가

**Files:**
- Modify: `frontend/shared/api.types.ts` (파일 끝, `ApiErrorBody` 앞이나 뒤에 추가)

**Interfaces:**
- Produces: `AccountDto`, `AccountRequest`, `AssetsSummaryDto`, `NetWorthSnapshotDto` — 이후 모든 백엔드·프론트엔드 태스크가 이 타입 이름을 그대로 쓴다.

- [ ] **Step 1: DTO 추가**

`frontend/shared/api.types.ts` 끝부분에 추가:

```typescript
export interface AccountDto {
  id: string
  name: string
  institution: string | null
  category: string
  balance: number
}

/** POST /api/assets/accounts, PUT /api/assets/accounts/:id */
export interface AccountRequest {
  name: string
  institution: string | null
  category: string
  balance: number
}

/** GET /api/assets/summary */
export interface AssetsSummaryDto {
  accounts: AccountDto[]
  assetTotal: number
  liabilityTotal: number
  netWorth: number
}

/** GET /api/assets/trend — month 오름차순 */
export interface NetWorthSnapshotDto {
  month: string
  assetTotal: number
  liabilityTotal: number
  netWorth: number
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npx tsc -b`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/shared/api.types.ts
git commit -m "feat(backend): 계좌/순자산 API 타입 추가"
```

---

## Task 5: `server/lib/validate.ts`에 `parseAccountRequest` 추가

**Files:**
- Modify: `frontend/server/lib/validate.ts` (상단 import 및 파일 끝에 함수 추가)

**Interfaces:**
- Consumes: `AccountRequest`(Task 4), `isAccountCategory`(Task 3), `asRecord`·`badRequest`(기존 `validate.ts` 헬퍼)
- Produces: `parseAccountRequest(body: unknown): AccountRequest` — Task 7(`route.ts`)에서 그대로 호출한다.

- [ ] **Step 1: import 추가**

`frontend/server/lib/validate.ts` 상단 import 블록을 수정:

```typescript
import { HTTPException } from 'hono/http-exception'
import type {
  AccountRequest,
  ExpenseRequest,
  InbodyRequest,
  PaymentMethod,
  UpdateReviewRequest,
  WorkFlowInput,
  WorkScreenRequest,
} from '../../shared/api.types.js'
import { isAccountCategory } from './assetCategories.js'
```

(기존 `import type { ... } from '../../shared/api.types.js'` 줄에 `AccountRequest`를 알파벳 순으로 끼워넣고, `isAccountCategory` import를 새로 추가한다.)

- [ ] **Step 2: `parseAccountRequest` 함수 추가**

파일 끝에 추가:

```typescript
export function parseAccountRequest(body: unknown): AccountRequest {
  const record = asRecord(body)
  const { name, institution, category, balance } = record

  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    badRequest('이름은 1자 이상 100자 이하로 입력해주세요.')
  }

  if (
    institution !== null &&
    institution !== undefined &&
    (typeof institution !== 'string' || institution.length > 100)
  ) {
    badRequest('기관명은 100자까지 입력할 수 있어요.')
  }

  if (typeof category !== 'string' || !isAccountCategory(category)) {
    badRequest('카테고리가 올바르지 않아요.')
  }

  if (
    typeof balance !== 'number' ||
    !Number.isInteger(balance) ||
    balance < 0 ||
    balance > 10_000_000_000
  ) {
    badRequest('금액은 0원 이상 100억원 이하의 정수여야 해요.')
  }

  return {
    name: name.trim(),
    institution: typeof institution === 'string' ? institution.trim() || null : null,
    category,
    balance,
  }
}
```

- [ ] **Step 3: 타입 검사**

Run: `cd frontend && npm run typecheck:api`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add frontend/server/lib/validate.ts
git commit -m "feat(backend): 계좌 요청 검증 추가"
```

---

## Task 6: `server/domains/assets/service.ts`

**Files:**
- Create: `frontend/server/domains/assets/service.ts`

**Interfaces:**
- Consumes: `UserClient`(`server/lib/supabase.ts`), `isLiabilityCategory`(Task 3), `AccountDto/AccountRequest/AssetsSummaryDto/NetWorthSnapshotDto`(Task 4)
- Produces: `getAssetsSummary`, `getAccount`, `listNetWorthTrend`, `createAccount`, `updateAccount`, `deleteAccount` — 전부 `(supabase: UserClient, userId: string, ...)` 시그니처. Task 7(`route.ts`)에서 그대로 호출한다.

- [ ] **Step 1: 파일 작성**

```typescript
import { HTTPException } from 'hono/http-exception'
import type {
  AccountDto,
  AccountRequest,
  AssetsSummaryDto,
  NetWorthSnapshotDto,
} from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'
import { isLiabilityCategory } from '../../lib/assetCategories.js'

function toAccountDto(row: {
  id: string
  name: string
  institution: string | null
  category: string
  balance: number
}): AccountDto {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    category: row.category,
    balance: row.balance,
  }
}

function computeTotals(accounts: { category: string; balance: number }[]): {
  assetTotal: number
  liabilityTotal: number
  netWorth: number
} {
  let assetTotal = 0
  let liabilityTotal = 0

  for (const account of accounts) {
    if (isLiabilityCategory(account.category)) {
      liabilityTotal += account.balance
    } else {
      assetTotal += account.balance
    }
  }

  return { assetTotal, liabilityTotal, netWorth: assetTotal - liabilityTotal }
}

function currentMonthStart(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  return `${year}-${month}-01`
}

/**
 * 계좌를 만들거나 고치거나 지울 때마다 이번 달 순자산 스냅샷을 다시 계산해 덮어쓴다.
 * 사용자가 따로 "이번 달 마감" 같은 절차를 밟지 않아도, 잔액을 바꾸는 순간이 곧
 * 그 달의 기록이 된다. 지난달 행은 이번 upsert 대상이 아니므로 그대로 얼어붙는다.
 */
async function syncNetWorthSnapshot(supabase: UserClient, userId: string): Promise<void> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('category,balance')
    .eq('user_id', userId)

  if (error) throw error

  const { assetTotal, liabilityTotal, netWorth } = computeTotals(accounts)

  const { error: upsertError } = await supabase.from('net_worth_snapshots').upsert(
    {
      user_id: userId,
      month: currentMonthStart(),
      asset_total: assetTotal,
      liability_total: liabilityTotal,
      net_worth: netWorth,
    },
    { onConflict: 'user_id,month' },
  )

  if (upsertError) throw upsertError
}

export async function getAssetsSummary(supabase: UserClient, userId: string): Promise<AssetsSummaryDto> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id,name,institution,category,balance')
    .eq('user_id', userId)
    .order('category', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const accounts = data.map(toAccountDto)
  const { assetTotal, liabilityTotal, netWorth } = computeTotals(data)

  return { accounts, assetTotal, liabilityTotal, netWorth }
}

export async function getAccount(supabase: UserClient, userId: string, id: string): Promise<AccountDto> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id,name,institution,category,balance')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new HTTPException(404, { message: '계좌를 찾을 수 없어요.' })
  }

  return toAccountDto(data)
}

export async function listNetWorthTrend(
  supabase: UserClient,
  userId: string,
): Promise<NetWorthSnapshotDto[]> {
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('month,asset_total,liability_total,net_worth')
    .eq('user_id', userId)
    .order('month', { ascending: true })

  if (error) throw error

  return data.map((row) => ({
    month: row.month,
    assetTotal: row.asset_total,
    liabilityTotal: row.liability_total,
    netWorth: row.net_worth,
  }))
}

export async function createAccount(
  supabase: UserClient,
  userId: string,
  body: AccountRequest,
): Promise<AccountDto> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: body.name,
      institution: body.institution,
      category: body.category,
      balance: body.balance,
    })
    .select('id,name,institution,category,balance')
    .single()

  if (error) throw error

  await syncNetWorthSnapshot(supabase, userId)

  return toAccountDto(data)
}

export async function updateAccount(
  supabase: UserClient,
  userId: string,
  id: string,
  body: AccountRequest,
): Promise<AccountDto> {
  const { data, error } = await supabase
    .from('accounts')
    .update({
      name: body.name,
      institution: body.institution,
      category: body.category,
      balance: body.balance,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id,name,institution,category,balance')
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new HTTPException(404, { message: '계좌를 찾을 수 없어요.' })
  }

  await syncNetWorthSnapshot(supabase, userId)

  return toAccountDto(data)
}

export async function deleteAccount(supabase: UserClient, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId)

  if (error) throw error

  await syncNetWorthSnapshot(supabase, userId)
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npm run typecheck:api`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/server/domains/assets/service.ts
git commit -m "feat(backend): 계좌/순자산 서비스 로직 추가"
```

---

## Task 7: `server/domains/assets/route.ts` + `app.ts` 등록

**Files:**
- Create: `frontend/server/domains/assets/route.ts`
- Modify: `frontend/server/app.ts`

**Interfaces:**
- Consumes: `parseAccountRequest`(Task 5), 모든 `service.ts` 함수(Task 6)
- Produces: `GET/POST /api/assets/*` 라우트 — Task 9(프론트 `api.ts`)가 호출하는 실제 엔드포인트.

- [ ] **Step 1: `route.ts` 작성**

```typescript
import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseAccountRequest } from '../../lib/validate.js'
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAssetsSummary,
  listNetWorthTrend,
  updateAccount,
} from './service.js'

const assetsRoute = new Hono<AppEnv>()

assetsRoute.use('*', requireAuth)

assetsRoute.get('/summary', async (c) => {
  return c.json(await getAssetsSummary(c.get('supabase'), c.get('userId')))
})

assetsRoute.get('/trend', async (c) => {
  return c.json(await listNetWorthTrend(c.get('supabase'), c.get('userId')))
})

assetsRoute.get('/accounts/:id', async (c) => {
  return c.json(await getAccount(c.get('supabase'), c.get('userId'), c.req.param('id')))
})

assetsRoute.post('/accounts', async (c) => {
  const body = parseAccountRequest(await c.req.json())

  return c.json(await createAccount(c.get('supabase'), c.get('userId'), body), 201)
})

assetsRoute.put('/accounts/:id', async (c) => {
  const body = parseAccountRequest(await c.req.json())

  return c.json(await updateAccount(c.get('supabase'), c.get('userId'), c.req.param('id'), body))
})

assetsRoute.delete('/accounts/:id', async (c) => {
  await deleteAccount(c.get('supabase'), c.get('userId'), c.req.param('id'))

  return c.body(null, 204)
})

export default assetsRoute
```

- [ ] **Step 2: `app.ts`에 라우트 등록**

`frontend/server/app.ts`의 import 블록에 추가:

```typescript
import assetsRoute from './domains/assets/route.js'
```

(`calendarRoute` import 바로 위, 알파벳 순으로 넣는다.)

`app.route(...)` 블록에 추가:

```typescript
app.route('/assets', assetsRoute)
```

(`app.route('/calendar', calendarRoute)` 바로 위에 넣는다.)

- [ ] **Step 3: 타입 검사**

Run: `cd frontend && npm run typecheck:api`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add frontend/server/domains/assets/route.ts frontend/server/app.ts
git commit -m "feat(backend): 계좌/순자산 API 라우트 추가"
```

---

## Task 8: 프론트 카테고리 상수

**Files:**
- Create: `frontend/src/lib/assetCategories.ts`

**Interfaces:**
- Produces: `ASSET_CATEGORIES`, `LIABILITY_CATEGORIES`, `ACCOUNT_CATEGORIES: readonly string[]` — Task 12(`AssetsPage`), Task 13(`AccountFormPage`)에서 그대로 쓴다.

- [ ] **Step 1: 파일 작성**

`server/lib/assetCategories.ts`(Task 3)와 내용은 동일하되, 프론트 전용 파일로 독립 유지한다 (`src/lib/categories.ts`가 지출 카테고리를 서버 `validate.ts`의 하드코딩 목록과 별개로 두는 것과 같은 방식 — 프론트/백엔드가 각자 검증한다).

```typescript
export const ASSET_CATEGORIES = ['현금성자산', '투자자산', '은퇴자산', '사용자산'] as const

export const LIABILITY_CATEGORIES = [
  '카드대출',
  '신용대출',
  '주거관련대출',
  '담보대출',
  '기타대출',
] as const

export const ACCOUNT_CATEGORIES = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES] as const

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number]

export function isAccountCategory(value: string): value is AccountCategory {
  return (ACCOUNT_CATEGORIES as readonly string[]).includes(value)
}

export function isLiabilityCategory(category: string): boolean {
  return (LIABILITY_CATEGORIES as readonly string[]).includes(category)
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npx tsc -b`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/assetCategories.ts
git commit -m "feat(frontend): 계좌 대분류 상수 추가"
```

---

## Task 9: `src/domains/assets/api.ts`

**Files:**
- Create: `frontend/src/domains/assets/api.ts`

**Interfaces:**
- Consumes: `apiFetch`(`src/lib/api/client.ts`), `AccountDto/AccountRequest/AssetsSummaryDto/NetWorthSnapshotDto`(Task 4)
- Produces: `fetchAssetsSummary`, `fetchNetWorthTrend`, `fetchAccount`, `createAccount`, `updateAccount`, `deleteAccount` — Task 10(훅)과 Task 13(폼)에서 호출한다.

- [ ] **Step 1: 파일 작성**

```typescript
import { apiFetch } from '@/lib/api/client'
import type {
  AccountDto,
  AccountRequest,
  AssetsSummaryDto,
  NetWorthSnapshotDto,
} from '@shared/api.types'

export function fetchAssetsSummary(): Promise<AssetsSummaryDto> {
  return apiFetch<AssetsSummaryDto>('/assets/summary')
}

export function fetchNetWorthTrend(): Promise<NetWorthSnapshotDto[]> {
  return apiFetch<NetWorthSnapshotDto[]>('/assets/trend')
}

export function fetchAccount(id: string): Promise<AccountDto> {
  return apiFetch<AccountDto>(`/assets/accounts/${id}`)
}

export function createAccount(body: AccountRequest): Promise<AccountDto> {
  return apiFetch<AccountDto>('/assets/accounts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateAccount(id: string, body: AccountRequest): Promise<AccountDto> {
  return apiFetch<AccountDto>(`/assets/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteAccount(id: string): Promise<void> {
  return apiFetch<void>(`/assets/accounts/${id}`, { method: 'DELETE' })
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npx tsc -b`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/assets/api.ts
git commit -m "feat(frontend): 계좌/순자산 API 클라이언트 추가"
```

---

## Task 10: `src/domains/assets/useAssets.ts`

**Files:**
- Create: `frontend/src/domains/assets/useAssets.ts`

**Interfaces:**
- Consumes: `fetchAssetsSummary`, `fetchNetWorthTrend`(Task 9)
- Produces: `useAssets(): { summary: AssetsSummaryDto | null, trend: NetWorthSnapshotDto[], isLoading: boolean, loadError: string | null, reload: () => void }` — Task 12(`AssetsPage`)가 그대로 쓴다.

- [ ] **Step 1: 파일 작성**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { fetchAssetsSummary, fetchNetWorthTrend } from '@/domains/assets/api'
import type { AssetsSummaryDto, NetWorthSnapshotDto } from '@shared/api.types'

interface Loaded {
  summary: AssetsSummaryDto
  trend: NetWorthSnapshotDto[]
}

export function useAssets() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoaded(null)
    setLoadError(null)

    Promise.all([fetchAssetsSummary(), fetchNetWorthTrend()])
      .then(([summary, trend]) => {
        if (!cancelled) setLoaded({ summary, trend })
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '불러오지 못했어요.')
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  return {
    summary: loaded?.summary ?? null,
    trend: loaded?.trend ?? [],
    isLoading: loaded === null && !loadError,
    loadError,
    reload,
  }
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npx tsc -b`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/assets/useAssets.ts
git commit -m "feat(frontend): 자산 요약 데이터 훅 추가"
```

---

## Task 11: `src/domains/assets/NetWorthTrendChart.tsx`

**Files:**
- Create: `frontend/src/domains/assets/NetWorthTrendChart.tsx`

**Interfaces:**
- Consumes: `NetWorthSnapshotDto[]`(Task 4)
- Produces: `NetWorthTrendChart({ snapshots: NetWorthSnapshotDto[] })` 컴포넌트 — Task 12(`AssetsPage`)가 그대로 쓴다.

- [ ] **Step 1: 파일 작성**

```tsx
import type { NetWorthSnapshotDto } from '@shared/api.types'

const WIDTH = 320
const HEIGHT = 96
const PADDING_Y = 12

export function NetWorthTrendChart({ snapshots }: { snapshots: NetWorthSnapshotDto[] }) {
  if (snapshots.length === 0) {
    return <p className="mt-2 text-content text-placeholder">아직 순자산 기록이 없어요.</p>
  }

  const values = snapshots.map((snapshot) => snapshot.netWorth)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = snapshots.map((snapshot, index) => {
    const x = snapshots.length === 1 ? WIDTH : (index / (snapshots.length - 1)) * WIDTH
    const y = HEIGHT - PADDING_Y - ((snapshot.netWorth - min) / range) * (HEIGHT - PADDING_Y * 2)

    return { x, y }
  })

  const last = points[points.length - 1]

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none">
        {points.length > 1 && (
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            className="stroke-cat-health-fg"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <circle cx={last.x} cy={last.y} r={3.5} className="fill-cat-health-fg" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-placeholder">
        {snapshots.map((snapshot) => (
          <span key={snapshot.month}>{Number(snapshot.month.slice(5, 7))}월</span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 타입 검사**

Run: `cd frontend && npx tsc -b`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/assets/NetWorthTrendChart.tsx
git commit -m "feat(frontend): 순자산 추이 SVG 라인 차트 추가"
```

---

## Task 12: `src/domains/assets/AssetsPage.tsx`

**Files:**
- Create: `frontend/src/domains/assets/AssetsPage.tsx`

**Interfaces:**
- Consumes: `useAssets`(Task 10), `NetWorthTrendChart`(Task 11), `ASSET_CATEGORIES`/`LIABILITY_CATEGORIES`(Task 8), `AccountDto`(Task 4)
- Produces: `AssetsPage` 컴포넌트 — Task 14에서 `/assets` 라우트에 연결한다.

- [ ] **Step 1: 파일 작성**

```tsx
import { Link } from 'react-router'
import { NetWorthTrendChart } from '@/domains/assets/NetWorthTrendChart'
import { useAssets } from '@/domains/assets/useAssets'
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '@/lib/assetCategories'
import type { AccountDto } from '@shared/api.types'

const GROUPS = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES]

export function AssetsPage() {
  const { summary, trend, isLoading, loadError, reload } = useAssets()

  if (isLoading) {
    return (
      <main className="py-5">
        <p className="text-center text-content text-muted">불러오는 중…</p>
      </main>
    )
  }

  if (loadError || !summary) {
    return (
      <main className="py-5 text-center">
        <p role="alert" className="text-content text-body">
          {loadError ?? '자산 정보를 찾을 수 없어요.'}
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
        >
          다시 시도
        </button>
      </main>
    )
  }

  const accountsByCategory = new Map<string, AccountDto[]>()
  for (const account of summary.accounts) {
    const list = accountsByCategory.get(account.category) ?? []
    list.push(account)
    accountsByCategory.set(account.category, list)
  }

  return (
    <main className="py-5 pb-10">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-date font-bold tracking-title text-ink">자산</h1>
        <Link
          to="/assets/new"
          className="shrink-0 rounded-full bg-chip px-3 py-1.5 text-label font-semibold text-chip-fg"
        >
          + 계좌 추가
        </Link>
      </div>

      <section className="mt-4 rounded-card border border-hairline bg-surface p-4">
        <p className="text-label font-semibold uppercase tracking-label text-muted">순자산</p>
        <p className="mt-1 text-amount font-bold text-ink">{summary.netWorth.toLocaleString('ko-KR')}원</p>

        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-cell bg-cat-health-bg px-3 py-2.5">
            <p className="text-label font-semibold text-cat-health-fg">자산 총액</p>
            <p className="mt-0.5 text-field font-bold text-ink">
              {summary.assetTotal.toLocaleString('ko-KR')}원
            </p>
          </div>
          <div className="flex-1 rounded-cell bg-cat-food-bg px-3 py-2.5">
            <p className="text-label font-semibold text-cat-food-fg">부채 총액</p>
            <p className="mt-0.5 text-field font-bold text-ink">
              {summary.liabilityTotal.toLocaleString('ko-KR')}원
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-card border border-hairline bg-surface p-4">
        <p className="text-label font-semibold uppercase tracking-label text-muted">순자산 추이</p>
        <NetWorthTrendChart snapshots={trend} />
      </section>

      <section className="mt-5">
        {GROUPS.map((category) => {
          const accounts = accountsByCategory.get(category) ?? []
          const subtotal = accounts.reduce((sum, account) => sum + account.balance, 0)

          return (
            <div key={category} className="mt-4 first:mt-0">
              <div className="mb-1.5 flex items-baseline justify-between px-0.5">
                <span className="text-label font-semibold uppercase tracking-label text-muted">
                  {category}
                </span>
                <span className="text-label font-semibold text-body">
                  {subtotal.toLocaleString('ko-KR')}원
                </span>
              </div>

              <ul className="overflow-hidden rounded-card border border-hairline bg-surface">
                {accounts.length === 0 ? (
                  <li className="px-4 py-3 text-center text-content text-placeholder">
                    등록된 계좌가 없어요.
                  </li>
                ) : (
                  accounts.map((account, index) => (
                    <li key={account.id} className={index > 0 ? 'border-t border-divider' : undefined}>
                      <Link
                        to={`/assets/${account.id}/edit`}
                        className="flex min-h-[44px] items-center justify-between gap-2 px-4 py-3"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-content font-semibold text-ink">
                            {account.name}
                          </span>
                          {account.institution && (
                            <span className="block text-label text-muted">{account.institution}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-content font-semibold text-body">
                          {account.balance.toLocaleString('ko-KR')}원
                        </span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )
        })}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: 타입 검사 및 린트**

Run: `cd frontend && npx tsc -b && npm run lint`
Expected: 둘 다 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/assets/AssetsPage.tsx
git commit -m "feat(frontend): 자산 요약 화면 추가"
```

---

## Task 13: `src/domains/assets/AccountFormPage.tsx`

**Files:**
- Create: `frontend/src/domains/assets/AccountFormPage.tsx`

**Interfaces:**
- Consumes: `fetchAccount/createAccount/updateAccount/deleteAccount`(Task 9), `ACCOUNT_CATEGORIES`(Task 8), `ConfirmDialog`(`src/components/ui/ConfirmDialog.tsx`, 기존 파일)
- Produces: `AccountFormPage` 컴포넌트 — Task 14에서 `/assets/new`, `/assets/:id/edit` 라우트에 연결한다.

- [ ] **Step 1: 파일 작성**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createAccount, deleteAccount, fetchAccount, updateAccount } from '@/domains/assets/api'
import { ACCOUNT_CATEGORIES } from '@/lib/assetCategories'
import type { AccountRequest } from '@shared/api.types'

export function AccountFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [category, setCategory] = useState<string>(ACCOUNT_CATEGORIES[0])
  const [balance, setBalance] = useState('')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    fetchAccount(id)
      .then((account) => {
        if (cancelled) return

        setName(account.name)
        setInstitution(account.institution ?? '')
        setCategory(account.category)
        setBalance(String(account.balance))
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '불러오지 못했어요.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const balanceValue = Number(balance)
  const canSave =
    name.trim().length > 0 &&
    balance.trim().length > 0 &&
    Number.isInteger(balanceValue) &&
    balanceValue >= 0

  const close = () => void navigate('/assets')

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

    const body: AccountRequest = {
      name: name.trim(),
      institution: institution.trim() || null,
      category,
      balance: balanceValue,
    }

    try {
      if (id) {
        await updateAccount(id, body)
      } else {
        await createAccount(body)
      }
      void navigate('/assets')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장하지 못했어요.')
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteAccount(id)
      void navigate('/assets')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '삭제하지 못했어요.')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-8 text-center text-content text-muted">
        불러오는 중…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-8 text-center">
        <p role="alert" className="text-content text-body">
          {loadError}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-10">
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-content text-muted"
          >
            ✕
          </button>
          <h1 className="text-field font-semibold text-ink">{isEdit ? '계좌 수정' : '계좌 추가'}</h1>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => void handleSave()}
            className="flex h-11 min-w-11 items-center justify-center px-1 text-field font-semibold text-ink disabled:text-placeholder"
          >
            저장
          </button>
        </div>

        <div className="mt-2">
          <label htmlFor="name" className="text-label font-semibold text-muted">
            이름
          </label>
          <input
            id="name"
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 생활비 통장"
            autoComplete="off"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink placeholder:text-placeholder"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="institution" className="text-label font-semibold text-muted">
            기관명
          </label>
          <input
            id="institution"
            value={institution}
            maxLength={100}
            onChange={(event) => setInstitution(event.target.value)}
            placeholder="예: 신한은행 (선택)"
            autoComplete="off"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-body placeholder:text-placeholder"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="category" className="text-label font-semibold text-muted">
            대분류
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink"
          >
            {ACCOUNT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="balance" className="text-label font-semibold text-muted">
            잔액
          </label>
          <input
            id="balance"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            placeholder="0"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink placeholder:text-placeholder"
          />
        </div>

        {saveError && (
          <p role="alert" className="mt-4 text-content text-cat-food-fg">
            {saveError}
          </p>
        )}

        <button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => void handleSave()}
          className="mt-6 min-h-[44px] w-full rounded-card bg-ink px-4 text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-3 min-h-[44px] w-full rounded-card border border-hairline bg-surface text-field font-semibold text-cat-food-fg"
          >
            삭제
          </button>
        )}

        {deleteError && (
          <p role="alert" className="mt-2 text-center text-content text-cat-food-fg">
            {deleteError}
          </p>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="이 계좌를 삭제할까요?"
          description="삭제해도 이전 달 순자산 기록에는 영향을 주지 않아요."
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: 타입 검사 및 린트**

Run: `cd frontend && npx tsc -b && npm run lint`
Expected: 둘 다 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/assets/AccountFormPage.tsx
git commit -m "feat(frontend): 계좌 추가/수정 화면 추가"
```

---

## Task 14: 라우트 등록 + 더보기 메뉴에 "자산" 추가

**Files:**
- Modify: `frontend/src/routes.tsx`
- Modify: `frontend/src/domains/more/MorePage.tsx`

**Interfaces:**
- Consumes: `AssetsPage`(Task 12), `AccountFormPage`(Task 13)
- Produces: `/assets`, `/assets/new`, `/assets/:id/edit` 경로, 더보기 메뉴 항목

- [ ] **Step 1: `routes.tsx` import 추가**

`frontend/src/routes.tsx` 상단 import 블록에 추가. 도메인 import는 `CalendarPage`부터 알파벳 순이므로, `import { LoginPage } from '@/domains/auth/LoginPage'` 아래·`import { CalendarPage } ...` 위에 넣는다:

```typescript
import { AccountFormPage } from '@/domains/assets/AccountFormPage'
import { AssetsPage } from '@/domains/assets/AssetsPage'
```

- [ ] **Step 2: 탭바 있는 그룹에 `/assets` 추가**

`{ path: '/work', element: <WorkListPage /> }` 아래, `{ path: '/more', element: <MorePage /> }` 위에 추가:

```typescript
          { path: '/assets', element: <AssetsPage /> },
```

- [ ] **Step 3: 탭바 없는 단독 그룹에 폼 라우트 추가**

`// 입력 화면은 목업대로 탭바 없이 단독으로 띄운다.` 주석 아래 블록에 추가 (`{ path: '/work/new', element: <WorkFormPage /> }` 옆):

```typescript
      { path: '/assets/new', element: <AccountFormPage /> },
      { path: '/assets/:id/edit', element: <AccountFormPage /> },
```

- [ ] **Step 4: 더보기 메뉴에 항목 추가**

`frontend/src/domains/more/MorePage.tsx`의 `menu` 배열을 수정 — `즐겨찾기`와 `통계` 사이에 `자산` 추가:

```typescript
  const menu = [
    { to: `/calendar/${today.slice(0, 4)}/${today.slice(5, 7)}`, label: '캘린더' },
    { to: '/favorites', label: '즐겨찾기' },
    { to: '/assets', label: '자산' },
    { to: '/stats', label: '통계' },
    { to: '/settings', label: '설정' },
  ]
```

- [ ] **Step 5: 타입 검사 및 린트**

Run: `cd frontend && npx tsc -b && npm run lint`
Expected: 둘 다 에러 없이 종료

- [ ] **Step 6: Commit**

```bash
git add frontend/src/routes.tsx frontend/src/domains/more/MorePage.tsx
git commit -m "feat(frontend): 자산 화면 라우트 및 더보기 메뉴 연결"
```

---

## Task 15: 전체 플로우 수동 검증

**Files:** 없음 (검증 전용 태스크)

**Interfaces:**
- Consumes: Task 1~14의 모든 결과물

- [ ] **Step 1: 개발 서버 실행**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: 브라우저로 확인**

1. 로그인 후 더보기 → 자산 진입, "자산" 메뉴가 보이는지 확인
2. `+ 계좌 추가`로 계좌 하나 생성 (예: 이름 "생활비 통장", 기관명 "신한은행", 대분류 "현금성자산", 잔액 300000)
3. 자산 페이지로 돌아왔을 때 순자산 요약 카드에 300,000원이 반영되는지, "현금성자산" 그룹 아래 계좌가 보이는지 확인
4. 순자산 추이 그래프에 이번 달 점 하나가 찍히는지 확인 (스냅샷 자동 upsert 확인)
5. 계좌를 하나 더 추가하고(대분류 "카드대출", 잔액 50000), 부채 총액과 순자산이 자산총액 − 부채총액으로 정확히 계산되는지 확인
6. 계좌를 눌러 수정 화면 진입 → 잔액을 바꿔 저장 → 요약 카드 숫자가 즉시 갱신되는지 확인
7. 삭제 버튼 → 확인 다이얼로그 → 삭제 → 목록에서 사라지는지, 요약 카드 총액이 다시 줄어드는지 확인
8. 네트워크 탭에서 `/api/assets/summary`, `/api/assets/trend` 응답이 기대한 모양인지 확인

- [ ] **Step 3: 문제 발견 시**

발견된 문제를 해당 태스크로 돌아가 수정하고, 수정 커밋을 새로 만든다 (기존 커밋을 amend하지 않는다).

- [ ] **Step 4: 최종 확인**

Run: `cd frontend && npm run build`
Expected: `tsc -b`와 `vite build` 모두 에러 없이 종료 — 배포 가능한 상태 확인
