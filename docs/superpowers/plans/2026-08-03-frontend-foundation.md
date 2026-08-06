# 프론트엔드 기반 세팅 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이후 모든 화면 작업이 얹힐 프론트엔드 토대 — 테스트 환경, 디자인 토큰, 라우팅, 앱 셸, API 클라이언트, MSW 목 서버 — 를 만든다.

**Architecture:** Vite + React 19 스캐폴드 위에 Tailwind v4의 `@theme`로 스펙의 디자인 토큰을 CSS 변수로 심고, React Router 7로 스펙의 URL 구조를 그대로 라우트로 옮긴다. 백엔드 API가 아직 없으므로 스펙 6장의 API 계약대로 MSW 목 서버를 만들어 프론트를 독립적으로 개발·테스트한다. 목 핸들러는 나중에 실제 Hono API로 교체할 때 프론트 코드를 건드리지 않아도 되도록 `/api/*` 경로와 응답 형태를 스펙과 1:1로 맞춘다.

**Tech Stack:** React 19.2 / TypeScript 6.0 / Vite 8 / Tailwind CSS v4 / React Router 7 / TanStack Query 5 / MSW 2 / Vitest 4 + React Testing Library / Playwright

## Global Constraints

모든 태스크의 요구사항에 아래가 암묵적으로 포함된다.

- 작업 디렉터리는 `frontend/`. 모든 npm 명령은 `frontend/`에서 실행한다.
- 패키지 매니저는 **npm** (백엔드만 pnpm).
- 색상·타이포·여백 값은 [MVP 설계 문서](../specs/2026-08-03-daily-log-mvp-design.md) 5장 토큰 표를 **글자 그대로** 쓴다. 목업 HTML과 어긋나면 토큰 표가 기준이다.
- **라이트 모드 전용.** 다크 모드 미디어 쿼리나 `dark:` 변형을 쓰지 않는다.
- 모바일 우선. 640px 이상에서 콘텐츠 최대 폭 **560px**, 중앙 정렬.
- 입력 필드 폰트 크기는 **16px 미만 금지** (iOS 자동 확대 방지).
- 터치 타깃 최소 **44×44px**.
- import는 절대경로(`@/...`)를 쓴다. 상대경로는 같은 폴더 안에서만.
- 컴포넌트 파일명은 `PascalCase.tsx`, 컴포넌트/타입은 `PascalCase`, 변수/함수는 `camelCase`.
- 화면 컴포넌트는 도메인 폴더(`src/domains/{도메인}/`) 아래, 공용 UI만 `src/components/`.
- `tsconfig.app.json`에 `verbatimModuleSyntax: true`가 켜져 있다. **타입만 가져오는 import는 반드시 `import type`을 쓴다.**
- `tsconfig.app.json`에 `erasableSyntaxOnly: true`가 켜져 있다. **생성자 파라미터 프로퍼티(`constructor(public x: number)`), enum, namespace를 쓸 수 없다.** 클래스 필드는 따로 선언하고 생성자에서 대입한다.
- 커밋 메시지는 Conventional Commits: `<type>(frontend): <subject>`.
- 각 태스크 종료 전 `npm run lint`가 통과해야 한다.

## 알아둘 사항 (계획 수립 시점의 판단)

- README 기술표에 없던 **React Router 7 · TanStack Query 5 · MSW 2 · Playwright**를 새로 추가한다. 스펙이 `/entries/:date` 같은 URL 구조, 낙관적 업데이트, 커서 무한 스크롤을 전제하므로 필요하다. Task 8에서 README에 반영한다.
- 폰트는 사용자가 `frontend/public/font/`에 넣어둔 **Paperlogy** 9종(TTF, 각 약 680KB)을 쓴다. `public/`에 두면 9개 전부가 빌드 결과물로 복사되므로 `src/assets/fonts/`로 옮기고, 스펙 타이포그래피가 쓰는 400/600/700 세 굵기만 `@font-face`로 참조한다. 나머지 굵기 파일은 지우지 않되 번들에는 포함되지 않는다.
- API 에러 응답 형태는 이 계획에서 `{ "error": { "code": string, "message": string } }`로 **정한다**. 나중에 Hono API를 만들 때 이 형태를 맞춰야 한다.

---

## File Structure

**설정 파일 (수정)**

| 경로 | 책임 |
|---|---|
| `frontend/vite.config.ts` | Vite 플러그인(React, Tailwind), `@` 별칭, Vitest 설정 |
| `frontend/tsconfig.app.json` | `@/*` 경로 매핑, 테스트 타입 등록 |
| `frontend/package.json` | `test`, `test:watch`, `test:e2e` 스크립트 |
| `frontend/index.html` | `lang="ko"`, `viewport-fit=cover` |
| `frontend/.gitignore` | Playwright 산출물 제외 |

**신규 파일**

| 경로 | 책임 |
|---|---|
| `src/test/setup.ts` | Vitest 전역 셋업 (jest-dom 매처, MSW 서버 생명주기) |
| `src/index.css` | Tailwind 진입점 + `@font-face` + `@theme` 디자인 토큰 |
| `src/lib/categories.ts` | 카테고리 6종 상수·타입, 태그 클래스/헥스 맵, 히트맵 색상 |
| `src/lib/date.ts` | `Asia/Seoul` 기준 날짜 키 생성·검증 |
| `src/lib/api/types.ts` | 스펙 API 10개의 요청·응답 DTO |
| `src/lib/api/client.ts` | `apiFetch` 래퍼, `ApiError` |
| `src/lib/queryClient.ts` | TanStack Query 기본 옵션 |
| `src/routes.tsx` | 라우트 정의 배열 |
| `src/components/routing/Redirects.tsx` | 오늘 날짜·이번 달로 보내는 리다이렉트 컴포넌트 |
| `src/components/layout/AppShell.tsx` | 레이아웃 라우트 (컨테이너 + `Outlet` + 탭바) |
| `src/components/layout/BottomTabBar.tsx` | 하단 탭 3개 |
| `src/components/NotFoundPage.tsx` | 404 화면 |
| `src/domains/{auth,entry,calendar,favorite,stats,settings,more}/*Page.tsx` | 화면 스텁 (이후 태스크에서 내용 채움) |
| `src/mocks/db.ts` | 목 서버 인메모리 스토어 + 시드 + 리셋 |
| `src/mocks/handlers/{entries,expenses,calendar,favorites,stats}.ts` | 도메인별 MSW 핸들러 |
| `src/mocks/handlers/index.ts` | 핸들러 합치기 |
| `src/mocks/server.ts` | Node(테스트)용 MSW 서버 |
| `src/mocks/browser.ts` | 브라우저(dev)용 MSW 워커 |
| `playwright.config.ts` | 모바일 뷰포트 E2E 설정 |
| `e2e/shell.spec.ts` | 앱 셸 스모크 E2E |

---

### Task 1: 테스트 환경과 경로 별칭

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.app.json`
- Modify: `frontend/package.json`
- Create: `frontend/src/test/setup.ts`
- Test: `frontend/src/test/setup.test.tsx`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `npm run test`로 Vitest 실행, `@/*` → `src/*` 절대경로 import, 전역 `describe`/`it`/`expect`/`vi`, `@testing-library/jest-dom` 매처

- [ ] **Step 1: 의존성 설치**

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

Vitest는 4.x, `@testing-library/react`는 React 19를 지원하는 16.x가 설치되어야 한다. 설치 후 `package.json`에서 확인한다.

- [ ] **Step 2: 실패하는 테스트 작성**

`frontend/src/test/setup.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import App from '@/App'

function Hello() {
  return <p>테스트 환경 준비 완료</p>
}

describe('테스트 환경', () => {
  it('컴포넌트를 렌더링하고 jest-dom 매처를 쓸 수 있다', () => {
    render(<Hello />)
    expect(screen.getByText('테스트 환경 준비 완료')).toBeInTheDocument()
  })

  it('@ 별칭으로 src 하위 모듈을 가져온다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `test` 스크립트가 없어 npm이 에러를 낸다 (`Missing script: "test"`).

- [ ] **Step 4: Vitest 설정 추가**

`frontend/vite.config.ts` 전체를 아래로 교체한다.

```ts
import { fileURLToPath, URL } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:5173' },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
```

`defineConfig`를 `vite`가 아니라 `vitest/config`에서 가져오는 점에 주의한다. `test` 필드는 그래야 타입이 잡힌다. `environmentOptions.jsdom.url`은 나중에 MSW가 상대경로 요청을 해석할 기준 오리진이 되므로 지금 넣어둔다.

- [ ] **Step 5: 전역 셋업 파일 작성**

`frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

`globals: true`이므로 React Testing Library의 자동 cleanup이 켜진다. 별도 `afterEach(cleanup)`은 필요 없다.

- [ ] **Step 6: tsconfig에 경로 매핑과 테스트 타입 추가**

`frontend/tsconfig.app.json`의 `compilerOptions`에서 `types` 줄을 아래로 바꾸고, `paths`를 추가한다.

```jsonc
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"],
    "paths": {
      "@/*": ["./src/*"]
    },
```

`moduleResolution: "bundler"`이므로 `baseUrl` 없이 `paths`만으로 동작한다.

- [ ] **Step 7: npm 스크립트 추가**

`frontend/package.json`의 `scripts`에 두 줄을 추가한다.

```jsonc
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 2개 테스트 통과

- [ ] **Step 9: 린트와 타입 체크**

Run: `npm run lint && npm run build`
Expected: 에러 없음

- [ ] **Step 10: 커밋**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tsconfig.app.json frontend/src/test
git commit -m "chore(frontend): vitest + RTL 테스트 환경과 @ 경로 별칭 설정"
```

---

### Task 2: Tailwind v4 디자인 토큰과 Paperlogy 폰트

**Files:**
- Modify: `frontend/vite.config.ts` (Tailwind 플러그인 추가)
- Modify: `frontend/src/index.css` (전체 교체)
- Move: `frontend/public/font/*.ttf` → `frontend/src/assets/fonts/`
- Create: `frontend/src/lib/categories.ts`
- Test: `frontend/src/lib/categories.test.ts`
- Delete: `frontend/src/App.css`

**Interfaces:**
- Consumes: Task 1의 Vitest 환경, `@/*` 별칭
- Produces:
  - Tailwind 유틸리티: `bg-canvas` `bg-surface` `border-hairline` `border-divider` `text-ink` `text-body` `text-muted` `text-placeholder` `bg-chip` `text-chip-fg`, 카테고리별 `bg-cat-{key}-bg` / `text-cat-{key}-fg`, 히트맵 `bg-heat-0`~`bg-heat-3`, 크기 `text-date` `text-label` `text-content` `text-amount` `text-field`, 자간 `tracking-title` `tracking-label`, 반경 `rounded-card` `rounded-sheet` `rounded-cell`
  - `CATEGORIES: readonly Category[]`, `type Category`, `CATEGORY_TAG_CLASS: Record<Category, string>`, `CATEGORY_HEX: Record<Category, { bg: string; fg: string }>`, `HEATMAP_HEX: readonly string[]`, `HEATMAP_CLASS: readonly string[]`

- [ ] **Step 1: Tailwind 설치**

```bash
npm install tailwindcss @tailwindcss/vite
```

Tailwind는 4.x여야 한다. v4는 `tailwind.config.js`도 PostCSS 설정도 만들지 않는다. 설정은 전부 CSS의 `@theme`에서 한다.

- [ ] **Step 2: 폰트를 src로 이동**

```bash
mkdir -p frontend/src/assets/fonts
mv frontend/public/font/*.ttf frontend/src/assets/fonts/
rmdir frontend/public/font
```

`public/`에 두면 참조 여부와 무관하게 9개(약 6MB) 전부가 `dist/`로 복사된다. `src/assets/`에 두고 CSS에서 `url()`로 참조하면 참조된 3개만 해시 파일명으로 번들된다.

- [ ] **Step 3: 실패하는 테스트 작성**

`frontend/src/lib/categories.test.ts`:

```ts
import {
  CATEGORIES,
  CATEGORY_HEX,
  CATEGORY_TAG_CLASS,
  HEATMAP_CLASS,
  HEATMAP_HEX,
} from '@/lib/categories'

describe('카테고리 토큰', () => {
  it('변동지출 6종이 스펙 순서대로 정의된다', () => {
    expect(CATEGORIES).toEqual(['식비', '외식비', '꾸밈비', '문화생활', '구독료', '건강'])
  })

  it('모든 카테고리에 태그 클래스가 있다', () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_TAG_CLASS[category]).toMatch(/^bg-cat-[a-z]+-bg text-cat-[a-z]+-fg$/)
    }
  })

  it('모든 카테고리에 배경·글자 헥스가 있다', () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_HEX[category].bg).toMatch(/^#[0-9A-F]{6}$/)
      expect(CATEGORY_HEX[category].fg).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('식비는 스펙 표의 색을 쓴다', () => {
    expect(CATEGORY_HEX['식비']).toEqual({ bg: '#FBE3D6', fg: '#B0664A' })
  })

  it('히트맵은 4단계다', () => {
    expect(HEATMAP_HEX).toHaveLength(4)
    expect(HEATMAP_CLASS).toHaveLength(4)
    expect(HEATMAP_HEX[0]).toBe('#F5F1EA')
    expect(HEATMAP_HEX[3]).toBe('#DCA98D')
  })
})
```

- [ ] **Step 4: 테스트가 실패하는지 확인**

Run: `npm test -- categories`
Expected: FAIL — `Failed to resolve import "@/lib/categories"`

- [ ] **Step 5: 카테고리 상수 모듈 작성**

`frontend/src/lib/categories.ts`:

```ts
export const CATEGORIES = ['식비', '외식비', '꾸밈비', '문화생활', '구독료', '건강'] as const

export type Category = (typeof CATEGORIES)[number]

/** Tailwind가 소스를 정적으로 스캔하므로 클래스 문자열은 반드시 리터럴로 둔다. */
export const CATEGORY_TAG_CLASS: Record<Category, string> = {
  식비: 'bg-cat-food-bg text-cat-food-fg',
  외식비: 'bg-cat-dining-bg text-cat-dining-fg',
  꾸밈비: 'bg-cat-beauty-bg text-cat-beauty-fg',
  문화생활: 'bg-cat-culture-bg text-cat-culture-fg',
  구독료: 'bg-cat-subscription-bg text-cat-subscription-fg',
  건강: 'bg-cat-health-bg text-cat-health-fg',
}

/** ECharts처럼 CSS 클래스를 못 쓰는 곳에서 사용한다. */
export const CATEGORY_HEX: Record<Category, { bg: string; fg: string }> = {
  식비: { bg: '#FBE3D6', fg: '#B0664A' },
  외식비: { bg: '#FCEBD0', fg: '#A87A2F' },
  꾸밈비: { bg: '#F7DFE6', fg: '#A85273' },
  문화생활: { bg: '#E4E0F2', fg: '#5B4E8C' },
  구독료: { bg: '#DDE7F2', fg: '#4A6E96' },
  건강: { bg: '#DDEBE0', fg: '#4A7C5E' },
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

/** 0단계(지출 없음) ~ 3단계 순서 */
export const HEATMAP_HEX = ['#F5F1EA', '#F7E7DC', '#F0CFBB', '#DCA98D'] as const

export const HEATMAP_CLASS = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3'] as const
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test -- categories`
Expected: PASS — 5개 테스트 통과

- [ ] **Step 7: Tailwind 플러그인 등록**

`frontend/vite.config.ts`에 import 한 줄과 플러그인 한 개를 추가한다.

```ts
import tailwindcss from '@tailwindcss/vite'
```

```ts
  plugins: [react(), tailwindcss()],
```

- [ ] **Step 8: index.css를 토큰 정의로 교체**

`frontend/src/index.css` 전체를 아래로 교체한다.

```css
@import 'tailwindcss';

/* 스펙 타이포그래피가 쓰는 굵기(400/600/700)만 참조한다.
   src/assets/fonts 의 나머지 굵기는 번들에 포함되지 않는다. */
@font-face {
  font-family: 'Paperlogy';
  src: url('./assets/fonts/Paperlogy-4Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Paperlogy';
  src: url('./assets/fonts/Paperlogy-6SemiBold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Paperlogy';
  src: url('./assets/fonts/Paperlogy-7Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@theme {
  --font-sans:
    'Paperlogy', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic',
    sans-serif;

  /* 표면 */
  --color-canvas: #fdfbf7;
  --color-surface: #fffdfa;
  --color-hairline: #ece6dc;
  --color-divider: #f2eee6;

  /* 텍스트 */
  --color-ink: #2b2a26;
  --color-body: #48453e;
  --color-muted: #aba391;
  --color-placeholder: #c4bca9;

  /* 칩 (미선택) */
  --color-chip: #f5f1ea;
  --color-chip-fg: #8a8271;

  /* 카테고리 */
  --color-cat-food-bg: #fbe3d6;
  --color-cat-food-fg: #b0664a;
  --color-cat-dining-bg: #fcebd0;
  --color-cat-dining-fg: #a87a2f;
  --color-cat-beauty-bg: #f7dfe6;
  --color-cat-beauty-fg: #a85273;
  --color-cat-culture-bg: #e4e0f2;
  --color-cat-culture-fg: #5b4e8c;
  --color-cat-subscription-bg: #dde7f2;
  --color-cat-subscription-fg: #4a6e96;
  --color-cat-health-bg: #ddebe0;
  --color-cat-health-fg: #4a7c5e;

  /* 히트맵 */
  --color-heat-0: #f5f1ea;
  --color-heat-1: #f7e7dc;
  --color-heat-2: #f0cfbb;
  --color-heat-3: #dca98d;

  /* 타이포그래피 (375px 기준) */
  --text-date: 22px;
  --text-date--line-height: 1.3;
  --text-label: 11px;
  --text-label--line-height: 1.4;
  --text-content: 15px;
  --text-content--line-height: 1.6;
  --text-amount: 32px;
  --text-amount--line-height: 1.2;
  --text-field: 16px;
  --text-field--line-height: 1.5;

  --tracking-title: -0.01em;
  --tracking-label: 0.14em;

  /* 모서리 반경 */
  --radius-card: 10px;
  --radius-sheet: 16px;
  --radius-cell: 8px;
}

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    background-color: var(--color-canvas);
    color: var(--color-body);
    font-family: var(--font-sans);
    font-size: var(--text-content);
    line-height: 1.6;
  }
}
```

- [ ] **Step 9: 쓰지 않는 App.css 제거**

```bash
git rm --cached frontend/src/App.css 2>/dev/null; rm -f frontend/src/App.css
```

`src/App.tsx`는 `App.css`를 import하지 않으므로 다른 수정이 필요 없다. (Task 3에서 `App.tsx` 자체를 지운다.)

- [ ] **Step 10: 빌드로 폰트 번들 확인**

Run: `npm run build`
Expected: 성공. 그리고 아래로 폰트가 3개만 들어갔는지 확인한다.

```bash
ls frontend/dist/assets | grep -i paperlogy
```

Expected: `Paperlogy-4Regular`, `Paperlogy-6SemiBold`, `Paperlogy-7Bold` 세 개만 해시 붙은 이름으로 존재

- [ ] **Step 11: 커밋**

```bash
git add frontend/src/index.css frontend/src/assets frontend/src/lib/categories.ts frontend/src/lib/categories.test.ts frontend/vite.config.ts frontend/package.json frontend/package-lock.json
git add -u frontend/src/App.css
git commit -m "feat(frontend): tailwind v4 디자인 토큰과 Paperlogy 폰트 설정"
```

---

### Task 3: 날짜 유틸과 라우트 골격

**Files:**
- Create: `frontend/src/lib/date.ts`
- Create: `frontend/src/routes.tsx`
- Create: `frontend/src/components/routing/Redirects.tsx`
- Create: `frontend/src/components/NotFoundPage.tsx`
- Create: `frontend/src/domains/auth/LoginPage.tsx`
- Create: `frontend/src/domains/entry/EntryPage.tsx`
- Create: `frontend/src/domains/calendar/CalendarPage.tsx`
- Create: `frontend/src/domains/favorite/FavoritesPage.tsx`
- Create: `frontend/src/domains/stats/StatsPage.tsx`
- Create: `frontend/src/domains/settings/SettingsPage.tsx`
- Create: `frontend/src/domains/more/MorePage.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/test/setup.test.tsx` (App import 제거)
- Delete: `frontend/src/App.tsx`
- Test: `frontend/src/lib/date.test.ts`, `frontend/src/routes.test.tsx`

**Interfaces:**
- Consumes: Task 1의 Vitest, Task 2의 Tailwind 토큰
- Produces:
  - `toDateKey(date: Date): string` — `YYYY-MM-DD` (Asia/Seoul)
  - `todayKey(): string`
  - `isValidDateKey(value: string): boolean`
  - `isValidYearMonth(year: string, month: string): boolean`
  - `routes: RouteObject[]` (`@/routes`)
  - 화면 컴포넌트 named export: `LoginPage` `EntryPage` `CalendarPage` `FavoritesPage` `StatsPage` `SettingsPage` `MorePage` `NotFoundPage`

- [ ] **Step 1: React Router 설치**

```bash
npm install react-router
```

v7부터는 패키지 이름이 `react-router`다. `react-router-dom`을 설치하지 않는다.

- [ ] **Step 2: 날짜 유틸의 실패하는 테스트 작성**

`frontend/src/lib/date.test.ts`:

```ts
import { isValidDateKey, isValidYearMonth, toDateKey, todayKey } from '@/lib/date'

describe('toDateKey', () => {
  it('UTC 시각을 Asia/Seoul 기준 날짜로 바꾼다', () => {
    expect(toDateKey(new Date('2026-08-03T01:00:00Z'))).toBe('2026-08-03')
  })

  it('UTC 15:00 이후는 서울 기준 다음 날이다', () => {
    expect(toDateKey(new Date('2026-08-03T15:00:00Z'))).toBe('2026-08-04')
  })

  it('UTC 14:59는 아직 서울 기준 같은 날이다', () => {
    expect(toDateKey(new Date('2026-08-03T14:59:59Z'))).toBe('2026-08-03')
  })

  it('한 자리 월·일을 0으로 채운다', () => {
    expect(toDateKey(new Date('2026-01-05T03:00:00Z'))).toBe('2026-01-05')
  })
})

describe('todayKey', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('현재 시각을 서울 기준 날짜 키로 준다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-03T16:30:00Z'))
    expect(todayKey()).toBe('2026-08-04')
  })
})

describe('isValidDateKey', () => {
  it('올바른 형식을 통과시킨다', () => {
    expect(isValidDateKey('2026-08-03')).toBe(true)
  })

  it('형식이 다르면 거부한다', () => {
    expect(isValidDateKey('2026-8-3')).toBe(false)
    expect(isValidDateKey('20260803')).toBe(false)
    expect(isValidDateKey('오늘')).toBe(false)
  })

  it('존재하지 않는 날짜를 거부한다', () => {
    expect(isValidDateKey('2026-02-31')).toBe(false)
    expect(isValidDateKey('2026-13-01')).toBe(false)
  })
})

describe('isValidYearMonth', () => {
  it('두 자리 월만 통과시킨다', () => {
    expect(isValidYearMonth('2026', '08')).toBe(true)
    expect(isValidYearMonth('2026', '8')).toBe(false)
    expect(isValidYearMonth('2026', '13')).toBe(false)
    expect(isValidYearMonth('26', '08')).toBe(false)
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test -- date`
Expected: FAIL — `Failed to resolve import "@/lib/date"`

- [ ] **Step 4: 날짜 유틸 구현**

`frontend/src/lib/date.ts`:

```ts
export const APP_TIME_ZONE = 'Asia/Seoul'

/** en-CA 로캘은 YYYY-MM-DD 형식을 준다. */
const dateKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function toDateKey(date: Date): string {
  return dateKeyFormat.format(date)
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function isValidYearMonth(year: string, month: string): boolean {
  return /^\d{4}$/.test(year) && /^(0[1-9]|1[0-2])$/.test(month)
}
```

- [ ] **Step 5: 날짜 테스트 통과 확인**

Run: `npm test -- date`
Expected: PASS — 9개 테스트 통과

- [ ] **Step 6: 라우팅의 실패하는 테스트 작성**

`frontend/src/routes.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('라우트', () => {
  it('/entries/:date 는 날짜를 화면에 표시한다', async () => {
    renderAt('/entries/2026-08-03')
    expect(await screen.findByText(/2026-08-03/)).toBeInTheDocument()
  })

  it('/calendar/:year/:month 는 연월을 화면에 표시한다', async () => {
    renderAt('/calendar/2026/08')
    expect(await screen.findByText(/2026년 8월/)).toBeInTheDocument()
  })

  it('/ 는 오늘 날짜 화면으로 리다이렉트한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-03T01:00:00Z'))
    try {
      renderAt('/')
      expect(await screen.findByText(/2026-08-03/)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('/calendar 는 이번 달로 리다이렉트한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-03T01:00:00Z'))
    try {
      renderAt('/calendar')
      expect(await screen.findByText(/2026년 8월/)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('정의되지 않은 경로는 404 화면을 보여준다', async () => {
    renderAt('/없는경로')
    expect(await screen.findByText('페이지를 찾을 수 없어요')).toBeInTheDocument()
  })

  it('나머지 화면도 모두 연결되어 있다', async () => {
    const cases: [string, string][] = [
      ['/login', '카카오로 로그인'],
      ['/more', '더보기'],
      ['/favorites', '즐겨찾기'],
      ['/stats', '통계'],
      ['/settings', '설정'],
    ]

    for (const [path, text] of cases) {
      const { unmount } = renderAt(path)
      expect(await screen.findByText(text)).toBeInTheDocument()
      unmount()
    }
  })
})
```

- [ ] **Step 7: 테스트가 실패하는지 확인**

Run: `npm test -- routes`
Expected: FAIL — `Failed to resolve import "@/routes"`

- [ ] **Step 8: 화면 스텁 작성**

이후 태스크에서 내용이 채워질 자리다. 지금은 라우트가 연결됐는지 확인할 최소한만 넣는다.

`frontend/src/domains/entry/EntryPage.tsx`:

```tsx
import { useParams } from 'react-router'

export function EntryPage() {
  const { date } = useParams<{ date: string }>()

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">{date}</h1>
    </main>
  )
}
```

`frontend/src/domains/calendar/CalendarPage.tsx`:

```tsx
import { useParams } from 'react-router'

export function CalendarPage() {
  const { year, month } = useParams<{ year: string; month: string }>()

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">
        {year}년 {Number(month)}월
      </h1>
    </main>
  )
}
```

`frontend/src/domains/auth/LoginPage.tsx`:

```tsx
export function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <h1 className="text-date font-bold tracking-title text-ink">카카오로 로그인</h1>
    </main>
  )
}
```

`frontend/src/domains/more/MorePage.tsx`:

```tsx
export function MorePage() {
  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">더보기</h1>
    </main>
  )
}
```

`frontend/src/domains/favorite/FavoritesPage.tsx`:

```tsx
export function FavoritesPage() {
  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">즐겨찾기</h1>
    </main>
  )
}
```

`frontend/src/domains/stats/StatsPage.tsx`:

```tsx
export function StatsPage() {
  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">통계</h1>
    </main>
  )
}
```

`frontend/src/domains/settings/SettingsPage.tsx`:

```tsx
export function SettingsPage() {
  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">설정</h1>
    </main>
  )
}
```

`frontend/src/components/NotFoundPage.tsx`:

```tsx
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <p className="text-content text-body">페이지를 찾을 수 없어요</p>
      <Link to="/" className="text-content font-semibold text-ink underline">
        오늘로 돌아가기
      </Link>
    </main>
  )
}
```

- [ ] **Step 9: 리다이렉트 컴포넌트 작성**

`frontend/src/components/routing/Redirects.tsx`:

```tsx
import { Navigate } from 'react-router'
import { todayKey } from '@/lib/date'

/** 렌더 시점에 날짜를 계산한다. 모듈 로드 시점에 고정하면 자정을 넘겼을 때 어제로 보낸다. */
export function TodayRedirect() {
  return <Navigate to={`/entries/${todayKey()}`} replace />
}

export function CurrentMonthRedirect() {
  const today = todayKey()

  return <Navigate to={`/calendar/${today.slice(0, 4)}/${today.slice(5, 7)}`} replace />
}
```

- [ ] **Step 10: 라우트 정의 작성**

`frontend/src/routes.tsx`:

```tsx
import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { CurrentMonthRedirect, TodayRedirect } from '@/components/routing/Redirects'
import { LoginPage } from '@/domains/auth/LoginPage'
import { CalendarPage } from '@/domains/calendar/CalendarPage'
import { EntryPage } from '@/domains/entry/EntryPage'
import { FavoritesPage } from '@/domains/favorite/FavoritesPage'
import { MorePage } from '@/domains/more/MorePage'
import { SettingsPage } from '@/domains/settings/SettingsPage'
import { StatsPage } from '@/domains/stats/StatsPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <TodayRedirect /> },
  { path: '/entries/:date', element: <EntryPage /> },
  { path: '/calendar', element: <CurrentMonthRedirect /> },
  { path: '/calendar/:year/:month', element: <CalendarPage /> },
  { path: '/more', element: <MorePage /> },
  { path: '/favorites', element: <FavoritesPage /> },
  { path: '/stats', element: <StatsPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '*', element: <NotFoundPage /> },
]
```

- [ ] **Step 11: main.tsx를 라우터로 교체하고 App.tsx 삭제**

`frontend/src/main.tsx` 전체를 아래로 교체한다.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'
import './index.css'
import { routes } from '@/routes'

const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

```bash
rm frontend/src/App.tsx
```

- [ ] **Step 12: Task 1의 스모크 테스트에서 App 참조 제거**

`frontend/src/test/setup.test.tsx`에서 `import App from '@/App'` 줄과 두 번째 `it` 블록을 지우고, 별칭 검증을 라우트 모듈로 바꾼다. 최종 내용:

```tsx
import { render, screen } from '@testing-library/react'
import { routes } from '@/routes'

function Hello() {
  return <p>테스트 환경 준비 완료</p>
}

describe('테스트 환경', () => {
  it('컴포넌트를 렌더링하고 jest-dom 매처를 쓸 수 있다', () => {
    render(<Hello />)
    expect(screen.getByText('테스트 환경 준비 완료')).toBeInTheDocument()
  })

  it('@ 별칭으로 src 하위 모듈을 가져온다', () => {
    expect(routes.some((route) => route.path === '/login')).toBe(true)
  })
})
```

- [ ] **Step 13: 전체 테스트와 빌드 확인**

Run: `npm test && npm run lint && npm run build`
Expected: 전부 통과

- [ ] **Step 14: 커밋**

```bash
git add frontend/src frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): Asia/Seoul 날짜 유틸과 화면 라우트 골격 추가"
```

---

### Task 4: 앱 셸 레이아웃과 하단 탭바

**Files:**
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/BottomTabBar.tsx`
- Modify: `frontend/src/routes.tsx` (레이아웃 라우트로 감싸기)
- Modify: `frontend/index.html` (`lang`, `viewport-fit`)
- Test: `frontend/src/components/layout/BottomTabBar.test.tsx`

**Interfaces:**
- Consumes: Task 2의 토큰 유틸리티, Task 3의 `routes`, `todayKey()`
- Produces: `AppShell` (레이아웃 라우트 element), `BottomTabBar`. 로그인·404를 제외한 모든 화면이 560px 컨테이너 안에서 렌더되고 하단 탭바가 붙는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/components/layout/BottomTabBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('하단 탭바', () => {
  it('탭 3개를 보여준다', async () => {
    renderAt('/entries/2026-08-03')
    const nav = await screen.findByRole('navigation', { name: '주요 메뉴' })
    expect(nav.querySelectorAll('a')).toHaveLength(3)
  })

  it('지출/기록 화면에서는 오늘 탭이 활성이다', async () => {
    renderAt('/entries/2026-08-03')
    expect(await screen.findByRole('link', { name: '오늘' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: '캘린더' })).not.toHaveAttribute('aria-current')
  })

  it('캘린더 화면에서는 캘린더 탭이 활성이다', async () => {
    renderAt('/calendar/2026/08')
    expect(await screen.findByRole('link', { name: '캘린더' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('즐겨찾기·통계·설정 화면에서는 더보기 탭이 활성이다', async () => {
    for (const path of ['/more', '/favorites', '/stats', '/settings']) {
      const { unmount } = renderAt(path)
      expect(await screen.findByRole('link', { name: '더보기' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      unmount()
    }
  })

  it('로그인 화면에는 탭바가 없다', async () => {
    renderAt('/login')
    expect(await screen.findByText('카카오로 로그인')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '주요 메뉴' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- BottomTabBar`
Expected: FAIL — `Unable to find an accessible element with the role "navigation"`

- [ ] **Step 3: 하단 탭바 구현**

`frontend/src/components/layout/BottomTabBar.tsx`:

```tsx
import { Link, useLocation } from 'react-router'
import { todayKey } from '@/lib/date'

interface Tab {
  key: string
  label: string
  to: string
  isActive: (pathname: string) => boolean
}

const MORE_PATHS = ['/more', '/favorites', '/stats', '/settings']

function buildTabs(today: string): Tab[] {
  return [
    {
      key: 'today',
      label: '오늘',
      to: `/entries/${today}`,
      isActive: (pathname) => pathname === '/' || pathname.startsWith('/entries'),
    },
    {
      key: 'calendar',
      label: '캘린더',
      to: `/calendar/${today.slice(0, 4)}/${today.slice(5, 7)}`,
      isActive: (pathname) => pathname.startsWith('/calendar'),
    },
    {
      key: 'more',
      label: '더보기',
      to: '/more',
      isActive: (pathname) => MORE_PATHS.some((path) => pathname.startsWith(path)),
    },
  ]
}

export function BottomTabBar() {
  const { pathname } = useLocation()
  const tabs = buildTabs(todayKey())

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex w-full max-w-[560px]">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)

          return (
            <li key={tab.key} className="flex-1">
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center justify-center py-3 text-label font-semibold tracking-label ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

스펙의 탭 이름은 `···`이지만 스크린 리더와 테스트가 식별할 수 있도록 텍스트는 `더보기`로 둔다. 시각적으로 `···`을 쓰고 싶다면 이후 아이콘 작업에서 `aria-label`을 유지한 채 교체한다.

- [ ] **Step 4: 앱 셸 구현**

`frontend/src/components/layout/AppShell.tsx`:

```tsx
import { Outlet } from 'react-router'
import { BottomTabBar } from './BottomTabBar'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-[calc(72px+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  )
}
```

하단 패딩은 고정된 탭바에 콘텐츠가 가리지 않게 확보한다.

- [ ] **Step 5: 라우트를 레이아웃으로 감싸기**

`frontend/src/routes.tsx`를 아래로 교체한다. 로그인과 404는 탭바 없이 단독으로 둔다.

```tsx
import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { AppShell } from '@/components/layout/AppShell'
import { CurrentMonthRedirect, TodayRedirect } from '@/components/routing/Redirects'
import { LoginPage } from '@/domains/auth/LoginPage'
import { CalendarPage } from '@/domains/calendar/CalendarPage'
import { EntryPage } from '@/domains/entry/EntryPage'
import { FavoritesPage } from '@/domains/favorite/FavoritesPage'
import { MorePage } from '@/domains/more/MorePage'
import { SettingsPage } from '@/domains/settings/SettingsPage'
import { StatsPage } from '@/domains/stats/StatsPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <TodayRedirect /> },
      { path: '/entries/:date', element: <EntryPage /> },
      { path: '/calendar', element: <CurrentMonthRedirect /> },
      { path: '/calendar/:year/:month', element: <CalendarPage /> },
      { path: '/more', element: <MorePage /> },
      { path: '/favorites', element: <FavoritesPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
```

- [ ] **Step 6: index.html 보정**

`frontend/index.html`에서 두 줄을 바꾼다.

```html
<html lang="ko">
```

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

`viewport-fit=cover`가 있어야 `env(safe-area-inset-bottom)`이 실제 값을 갖는다.

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 탭바 5개 + 기존 테스트 전부

- [ ] **Step 8: 브라우저에서 눈으로 확인**

Run: `npm run dev` 후 브라우저에서 `http://localhost:5173/` 접속
Expected: 오늘 날짜 화면으로 이동하고, 아이보리 배경(`#FDFBF7`)에 Paperlogy 폰트로 날짜가 보이며, 하단에 탭 3개가 고정되어 있다. 창을 넓혀도 콘텐츠가 560px 안에서 가운데 정렬된다.

- [ ] **Step 9: 커밋**

```bash
git add frontend/src frontend/index.html
git commit -m "feat(frontend): 하단 탭바와 560px 앱 셸 레이아웃 추가"
```

---

### Task 5: API 클라이언트와 TanStack Query 프로바이더

**Files:**
- Create: `frontend/src/lib/api/types.ts`
- Create: `frontend/src/lib/api/client.ts`
- Create: `frontend/src/lib/queryClient.ts`
- Modify: `frontend/src/main.tsx`
- Test: `frontend/src/lib/api/client.test.ts`

**Interfaces:**
- Consumes: Task 2의 `Category` 타입
- Produces:
  - `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` — `path`는 `/api`를 제외한 나머지 (`'/entries/2026-08-03'`)
  - `class ApiError extends Error { status: number; code: string }`
  - DTO 타입: `PaymentMethod` `Expense` `DailyEntry` `DailyEntryResponse` `UpdateEntryRequest` `CreateExpenseRequest` `UpdateExpenseRequest` `CalendarDay` `CalendarResponse` `FavoriteItem` `FavoritesResponse` `CategoryStat` `CategoryStatsResponse` `MonthlyStat` `MonthlyStatsResponse`
  - `createQueryClient(): QueryClient`

- [ ] **Step 1: TanStack Query 설치**

```bash
npm install @tanstack/react-query
```

- [ ] **Step 2: 실패하는 테스트 작성**

`frontend/src/lib/api/client.test.ts`:

```ts
import { ApiError, apiFetch } from '@/lib/api/client'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('/api 를 앞에 붙여 절대 URL로 요청한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch<{ ok: boolean }>('/entries/2026-08-03')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5173/api/entries/2026-08-03',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    )
  })

  it('204 응답은 undefined를 준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(apiFetch('/expenses/abc', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('에러 응답을 ApiError로 바꾼다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'INVALID_AMOUNT', message: '금액이 올바르지 않아요.' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await apiFetch('/entries/2026-08-03/expenses', { method: 'POST' }).catch(
      (caught: unknown) => caught,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: 'INVALID_AMOUNT',
      message: '금액이 올바르지 않아요.',
    })
  })

  it('에러 본문이 JSON이 아니어도 ApiError를 던진다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>500</html>', { status: 500 })))

    const error = await apiFetch('/stats/monthly').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 500, code: 'UNKNOWN' })
  })

  it('네트워크 실패는 status 0 으로 감싼다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await apiFetch('/entries/2026-08-03').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test -- client`
Expected: FAIL — `Failed to resolve import "@/lib/api/client"`

- [ ] **Step 4: DTO 타입 정의**

`frontend/src/lib/api/types.ts`:

```ts
import type { Category } from '@/lib/categories'

export type PaymentMethod = 'card' | 'cash' | 'transfer'

export interface Expense {
  id: string
  entryDate: string
  amount: number
  category: Category
  memo: string
  paymentMethod: PaymentMethod | null
}

export interface DailyEntry {
  entryDate: string
  moodScore: number | null
  gratitude: string | null
  noteMarkdown: string | null
  isFavorite: boolean
}

/** GET /api/entries/:date */
export interface DailyEntryResponse {
  entry: DailyEntry
  expenses: Expense[]
}

/** PUT /api/entries/:date */
export interface UpdateEntryRequest {
  moodScore: number | null
  gratitude: string | null
  noteMarkdown: string | null
}

/** POST /api/entries/:date/expenses */
export interface CreateExpenseRequest {
  amount: number
  category: Category
  memo: string
  paymentMethod?: PaymentMethod | null
}

/** PATCH /api/expenses/:id */
export type UpdateExpenseRequest = Partial<CreateExpenseRequest>

export interface CalendarDay {
  entryDate: string
  totalAmount: number
  isFavorite: boolean
}

/** GET /api/calendar?year=&month= */
export interface CalendarResponse {
  year: number
  month: number
  days: CalendarDay[]
}

export interface FavoriteItem {
  entryDate: string
  moodScore: number | null
  preview: string | null
}

/** GET /api/favorites?cursor= */
export interface FavoritesResponse {
  items: FavoriteItem[]
  nextCursor: string | null
}

export interface CategoryStat {
  category: Category
  totalAmount: number
}

/** GET /api/stats/categories?year=&month= */
export interface CategoryStatsResponse {
  year: number
  month: number
  items: CategoryStat[]
}

export interface MonthlyStat {
  /** YYYY-MM */
  yearMonth: string
  totalAmount: number
}

/** GET /api/stats/monthly?months=6 */
export interface MonthlyStatsResponse {
  items: MonthlyStat[]
}
```

- [ ] **Step 5: API 클라이언트 구현**

`frontend/src/lib/api/client.ts`:

```ts
const API_BASE_PATH = '/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
  }
}

/** jsdom과 Node의 fetch는 상대 URL을 해석하지 못하므로 절대 URL로 만들어 넘긴다. */
function resolveUrl(path: string): string {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin

  return new URL(`${API_BASE_PATH}${path}`, origin).toString()
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(resolveUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크에 연결할 수 없어요. 잠시 후 다시 시도해주세요.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody

    throw new ApiError(
      response.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? '요청을 처리하지 못했어요.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
```

`headers`는 평범한 객체로만 넘긴다는 전제다. `Headers` 인스턴스를 넘기면 스프레드가 빈 객체가 되므로 쓰지 않는다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test -- client`
Expected: PASS — 5개 테스트 통과

- [ ] **Step 7: Query 클라이언트 설정**

`frontend/src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // 4xx는 다시 보내도 같은 결과다. 서버리스 콜드 스타트를 감안해 그 외에는 한 번만 재시도한다.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false
          }

          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
```

- [ ] **Step 8: main.tsx에 프로바이더 연결**

`frontend/src/main.tsx` 전체를 아래로 교체한다.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter } from 'react-router'
import './index.css'
import { createQueryClient } from '@/lib/queryClient'
import { routes } from '@/routes'

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 9: 전체 확인**

Run: `npm test && npm run lint && npm run build`
Expected: 전부 통과

- [ ] **Step 10: 커밋**

```bash
git add frontend/src frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): API 클라이언트와 TanStack Query 프로바이더 추가"
```

---

### Task 6: MSW 인메모리 스토어와 일기·지출 핸들러

**Files:**
- Create: `frontend/src/mocks/db.ts`
- Create: `frontend/src/mocks/handlers/entries.ts`
- Create: `frontend/src/mocks/handlers/expenses.ts`
- Create: `frontend/src/mocks/handlers/index.ts`
- Create: `frontend/src/mocks/server.ts`
- Modify: `frontend/src/test/setup.ts`
- Test: `frontend/src/mocks/handlers/entries.test.ts`, `frontend/src/mocks/handlers/expenses.test.ts`

**Interfaces:**
- Consumes: Task 5의 `apiFetch`와 DTO 타입, Task 2의 `CATEGORIES`/`isCategory`, Task 3의 `toDateKey`
- Produces:
  - `db: { entries: Map<string, DailyEntry>; expenses: Expense[] }`
  - `resetDb(): void` — 시드 상태로 되돌린다 (테스트마다 호출됨)
  - `seedDateKey(daysAgo: number): string`
  - `handlers: RequestHandler[]` (`@/mocks/handlers`)
  - `server` (`@/mocks/server`) — 테스트 셋업에서 자동 기동

- [ ] **Step 1: MSW 설치**

```bash
npm install -D msw
```

MSW는 2.x여야 한다.

- [ ] **Step 2: 실패하는 테스트 작성 — 일기**

`frontend/src/mocks/handlers/entries.test.ts`:

```ts
import { ApiError, apiFetch } from '@/lib/api/client'
import type { DailyEntryResponse } from '@/lib/api/types'

describe('일기 목 핸들러', () => {
  it('기록이 없는 날짜도 빈 엔트리를 준다', async () => {
    const result = await apiFetch<DailyEntryResponse>('/entries/2020-01-01')

    expect(result.entry).toEqual({
      entryDate: '2020-01-01',
      moodScore: null,
      gratitude: null,
      noteMarkdown: null,
      isFavorite: false,
    })
    expect(result.expenses).toEqual([])
  })

  it('PUT으로 저장한 내용이 다시 조회된다', async () => {
    await apiFetch<DailyEntryResponse>('/entries/2026-07-01', {
      method: 'PUT',
      body: JSON.stringify({ moodScore: 4, gratitude: '비가 그쳤다', noteMarkdown: '### 오늘' }),
    })

    const result = await apiFetch<DailyEntryResponse>('/entries/2026-07-01')

    expect(result.entry.moodScore).toBe(4)
    expect(result.entry.gratitude).toBe('비가 그쳤다')
    expect(result.entry.noteMarkdown).toBe('### 오늘')
  })

  it('테스트 사이에 스토어가 초기화된다', async () => {
    const result = await apiFetch<DailyEntryResponse>('/entries/2026-07-01')

    expect(result.entry.moodScore).toBeNull()
  })

  it('즐겨찾기를 토글한다', async () => {
    const first = await apiFetch<{ isFavorite: boolean }>('/entries/2026-07-02/favorite', {
      method: 'PATCH',
    })
    expect(first.isFavorite).toBe(true)

    const second = await apiFetch<{ isFavorite: boolean }>('/entries/2026-07-02/favorite', {
      method: 'PATCH',
    })
    expect(second.isFavorite).toBe(false)
  })

  it('잘못된 날짜 형식은 400을 준다', async () => {
    const error = await apiFetch('/entries/2026-7-1').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'INVALID_DATE' })
  })

  it('기분 점수가 1~5를 벗어나면 400을 준다', async () => {
    const error = await apiFetch('/entries/2026-07-01', {
      method: 'PUT',
      body: JSON.stringify({ moodScore: 9, gratitude: null, noteMarkdown: null }),
    }).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 400, code: 'INVALID_MOOD_SCORE' })
  })
})
```

세 번째 테스트는 두 번째 테스트가 남긴 상태가 지워졌는지 검증한다. 순서에 의존하므로 이 파일 안에서 위치를 바꾸지 않는다.

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test -- entries`
Expected: FAIL — 목 서버가 없어 요청이 실제로 나가고 `ApiError(0, 'NETWORK_ERROR')`가 난다.

- [ ] **Step 4: 인메모리 스토어 작성**

`frontend/src/mocks/db.ts`:

```ts
import type { DailyEntry, Expense } from '@/lib/api/types'
import { toDateKey } from '@/lib/date'

interface MockDb {
  entries: Map<string, DailyEntry>
  expenses: Expense[]
}

export const db: MockDb = {
  entries: new Map(),
  expenses: [],
}

/** 시드는 개발 중 브라우저에서 볼 데이터다. 오늘 기준 상대 날짜여야 캘린더가 항상 채워져 보인다. */
export function seedDateKey(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)

  return toDateKey(date)
}

export function createEmptyEntry(entryDate: string): DailyEntry {
  return {
    entryDate,
    moodScore: null,
    gratitude: null,
    noteMarkdown: null,
    isFavorite: false,
  }
}

function seedEntries(): Map<string, DailyEntry> {
  return new Map<string, DailyEntry>([
    [
      seedDateKey(0),
      {
        entryDate: seedDateKey(0),
        moodScore: 4,
        gratitude: '점심에 마신 커피가 좋았다',
        noteMarkdown: '### 오늘\n- 설계 문서를 마무리했다',
        isFavorite: false,
      },
    ],
    [
      seedDateKey(1),
      {
        entryDate: seedDateKey(1),
        moodScore: 5,
        gratitude: '오랜만에 친구를 만났다',
        noteMarkdown: '저녁까지 이야기했다.',
        isFavorite: true,
      },
    ],
    [
      seedDateKey(9),
      {
        entryDate: seedDateKey(9),
        moodScore: 2,
        gratitude: null,
        noteMarkdown: '피곤한 하루.',
        isFavorite: true,
      },
    ],
  ])
}

function seedExpenses(): Expense[] {
  return [
    { id: 'seed-1', entryDate: seedDateKey(0), amount: 4500, category: '식비', memo: '아메리카노', paymentMethod: 'card' },
    { id: 'seed-2', entryDate: seedDateKey(0), amount: 12000, category: '외식비', memo: '점심 국밥', paymentMethod: 'card' },
    { id: 'seed-3', entryDate: seedDateKey(1), amount: 38000, category: '문화생활', memo: '전시 티켓', paymentMethod: 'card' },
    { id: 'seed-4', entryDate: seedDateKey(3), amount: 9900, category: '구독료', memo: '음악 스트리밍', paymentMethod: 'card' },
    { id: 'seed-5', entryDate: seedDateKey(9), amount: 62000, category: '꾸밈비', memo: '가을 셔츠', paymentMethod: 'transfer' },
    { id: 'seed-6', entryDate: seedDateKey(20), amount: 25000, category: '건강', memo: '영양제', paymentMethod: 'cash' },
    { id: 'seed-7', entryDate: seedDateKey(40), amount: 18000, category: '식비', memo: '장보기', paymentMethod: 'card' },
  ]
}

export function resetDb(): void {
  db.entries = seedEntries()
  db.expenses = seedExpenses()
}

resetDb()
```

- [ ] **Step 5: 일기 핸들러 작성**

`frontend/src/mocks/handlers/entries.ts`:

```ts
import { HttpResponse, http } from 'msw'
import type { DailyEntryResponse, UpdateEntryRequest } from '@/lib/api/types'
import { createEmptyEntry, db } from '@/mocks/db'
import { isValidDateKey } from '@/lib/date'

export function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status })
}

function invalidDate() {
  return errorResponse(400, 'INVALID_DATE', '날짜 형식이 올바르지 않아요.')
}

export const entryHandlers = [
  http.get('/api/entries/:date', ({ params }) => {
    const date = String(params.date)

    if (!isValidDateKey(date)) {
      return invalidDate()
    }

    const body: DailyEntryResponse = {
      entry: db.entries.get(date) ?? createEmptyEntry(date),
      expenses: db.expenses
        .filter((expense) => expense.entryDate === date)
        .sort((a, b) => a.id.localeCompare(b.id)),
    }

    return HttpResponse.json(body)
  }),

  http.put('/api/entries/:date', async ({ params, request }) => {
    const date = String(params.date)

    if (!isValidDateKey(date)) {
      return invalidDate()
    }

    const payload = (await request.json()) as UpdateEntryRequest

    if (payload.moodScore !== null && (payload.moodScore < 1 || payload.moodScore > 5)) {
      return errorResponse(400, 'INVALID_MOOD_SCORE', '기분 점수는 1~5 사이여야 해요.')
    }

    if (payload.gratitude !== null && payload.gratitude.length > 200) {
      return errorResponse(400, 'GRATITUDE_TOO_LONG', '감사한 일은 200자까지 쓸 수 있어요.')
    }

    if (payload.noteMarkdown !== null && payload.noteMarkdown.length > 10_000) {
      return errorResponse(400, 'NOTE_TOO_LONG', '오늘의 기록은 10,000자까지 쓸 수 있어요.')
    }

    const previous = db.entries.get(date) ?? createEmptyEntry(date)
    const updated = {
      ...previous,
      moodScore: payload.moodScore,
      gratitude: payload.gratitude,
      noteMarkdown: payload.noteMarkdown,
    }

    db.entries.set(date, updated)

    return HttpResponse.json({ entry: updated })
  }),

  http.patch('/api/entries/:date/favorite', ({ params }) => {
    const date = String(params.date)

    if (!isValidDateKey(date)) {
      return invalidDate()
    }

    const previous = db.entries.get(date) ?? createEmptyEntry(date)
    const updated = { ...previous, isFavorite: !previous.isFavorite }

    db.entries.set(date, updated)

    return HttpResponse.json({ entryDate: date, isFavorite: updated.isFavorite })
  }),
]
```

- [ ] **Step 6: 핸들러 모음과 Node 서버 작성**

`frontend/src/mocks/handlers/index.ts`:

```ts
import { entryHandlers } from './entries'

export const handlers = [...entryHandlers]
```

`frontend/src/mocks/server.ts`:

```ts
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

export const server = setupServer(...handlers)
```

- [ ] **Step 7: 테스트 셋업에 목 서버 연결**

`frontend/src/test/setup.ts` 전체를 아래로 교체한다.

```ts
import '@testing-library/jest-dom/vitest'
import { resetDb } from '@/mocks/db'
import { server } from '@/mocks/server'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetDb()
})

afterAll(() => {
  server.close()
})
```

`onUnhandledRequest: 'error'`로 두면 핸들러를 빠뜨린 요청이 조용히 실제 네트워크로 나가지 않고 테스트가 실패한다.

> Task 5의 `client.test.ts`는 `fetch`를 스텁으로 갈아끼우므로 MSW를 거치지 않는다. 그대로 통과해야 한다.

- [ ] **Step 8: 일기 테스트 통과 확인**

Run: `npm test -- entries`
Expected: PASS — 6개 테스트 통과

- [ ] **Step 9: 지출 핸들러의 실패하는 테스트 작성**

`frontend/src/mocks/handlers/expenses.test.ts`:

```ts
import { ApiError, apiFetch } from '@/lib/api/client'
import type { DailyEntryResponse, Expense } from '@/lib/api/types'

const DATE = '2026-07-10'

async function addExpense(body: Record<string, unknown>) {
  return apiFetch<Expense>(`/entries/${DATE}/expenses`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('지출 목 핸들러', () => {
  it('지출을 추가하면 그날 조회에 나온다', async () => {
    const created = await addExpense({ amount: 4500, category: '식비', memo: '아메리카노' })

    expect(created.id).toEqual(expect.any(String))
    expect(created.entryDate).toBe(DATE)
    expect(created.paymentMethod).toBeNull()

    const result = await apiFetch<DailyEntryResponse>(`/entries/${DATE}`)

    expect(result.expenses).toHaveLength(1)
    expect(result.expenses[0].memo).toBe('아메리카노')
  })

  it('지출을 수정한다', async () => {
    const created = await addExpense({ amount: 4500, category: '식비', memo: '아메리카노' })

    const updated = await apiFetch<Expense>(`/expenses/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount: 5000, memo: '라떼' }),
    })

    expect(updated.amount).toBe(5000)
    expect(updated.memo).toBe('라떼')
    expect(updated.category).toBe('식비')
  })

  it('지출을 삭제하면 204를 주고 목록에서 사라진다', async () => {
    const created = await addExpense({ amount: 4500, category: '식비', memo: '아메리카노' })

    await expect(
      apiFetch(`/expenses/${created.id}`, { method: 'DELETE' }),
    ).resolves.toBeUndefined()

    const result = await apiFetch<DailyEntryResponse>(`/entries/${DATE}`)

    expect(result.expenses).toHaveLength(0)
  })

  it('없는 지출을 수정하면 404를 준다', async () => {
    const error = await apiFetch('/expenses/없는아이디', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 1000 }),
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'EXPENSE_NOT_FOUND' })
  })

  it('금액이 0 이하거나 1억을 넘으면 400을 준다', async () => {
    await expect(addExpense({ amount: 0, category: '식비', memo: '메모' })).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_AMOUNT',
    })

    await expect(
      addExpense({ amount: 100_000_001, category: '식비', memo: '메모' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_AMOUNT' })
  })

  it('목록에 없는 카테고리는 400을 준다', async () => {
    await expect(
      addExpense({ amount: 1000, category: '교통비', memo: '버스' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_CATEGORY' })
  })

  it('메모가 비었거나 100자를 넘으면 400을 준다', async () => {
    await expect(addExpense({ amount: 1000, category: '식비', memo: '' })).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_MEMO',
    })

    await expect(
      addExpense({ amount: 1000, category: '식비', memo: 'ㄱ'.repeat(101) }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_MEMO' })
  })
})
```

- [ ] **Step 10: 테스트가 실패하는지 확인**

Run: `npm test -- expenses`
Expected: FAIL — 핸들러가 없어 `onUnhandledRequest: 'error'`로 요청이 거부된다.

- [ ] **Step 11: 지출 핸들러 구현**

`frontend/src/mocks/handlers/expenses.ts`:

```ts
import { HttpResponse, http } from 'msw'
import type { CreateExpenseRequest, Expense, UpdateExpenseRequest } from '@/lib/api/types'
import { isCategory } from '@/lib/categories'
import { isValidDateKey } from '@/lib/date'
import { db } from '@/mocks/db'
import { errorResponse } from './entries'

const MAX_AMOUNT = 100_000_000

let nextId = 1

function validate(payload: UpdateExpenseRequest) {
  if (payload.amount !== undefined && (!Number.isInteger(payload.amount) || payload.amount < 1 || payload.amount > MAX_AMOUNT)) {
    return errorResponse(400, 'INVALID_AMOUNT', '금액은 1원 이상 1억 원 이하여야 해요.')
  }

  if (payload.category !== undefined && !isCategory(payload.category)) {
    return errorResponse(400, 'INVALID_CATEGORY', '지원하지 않는 카테고리예요.')
  }

  if (payload.memo !== undefined && (payload.memo.length < 1 || payload.memo.length > 100)) {
    return errorResponse(400, 'INVALID_MEMO', '메모는 1자 이상 100자 이하여야 해요.')
  }

  return null
}

export const expenseHandlers = [
  http.post('/api/entries/:date/expenses', async ({ params, request }) => {
    const date = String(params.date)

    if (!isValidDateKey(date)) {
      return errorResponse(400, 'INVALID_DATE', '날짜 형식이 올바르지 않아요.')
    }

    const payload = (await request.json()) as CreateExpenseRequest

    if (payload.amount === undefined || payload.category === undefined || payload.memo === undefined) {
      return errorResponse(400, 'MISSING_FIELD', '금액·카테고리·메모는 필수예요.')
    }

    const invalid = validate(payload)

    if (invalid) {
      return invalid
    }

    const created: Expense = {
      id: `mock-${nextId++}`,
      entryDate: date,
      amount: payload.amount,
      category: payload.category,
      memo: payload.memo,
      paymentMethod: payload.paymentMethod ?? null,
    }

    db.expenses.push(created)

    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/expenses/:id', async ({ params, request }) => {
    const id = String(params.id)
    const index = db.expenses.findIndex((expense) => expense.id === id)

    if (index === -1) {
      return errorResponse(404, 'EXPENSE_NOT_FOUND', '수정할 지출을 찾지 못했어요.')
    }

    const payload = (await request.json()) as UpdateExpenseRequest
    const invalid = validate(payload)

    if (invalid) {
      return invalid
    }

    const updated: Expense = { ...db.expenses[index], ...payload }
    db.expenses[index] = updated

    return HttpResponse.json(updated)
  }),

  http.delete('/api/expenses/:id', ({ params }) => {
    const id = String(params.id)
    const index = db.expenses.findIndex((expense) => expense.id === id)

    if (index === -1) {
      return errorResponse(404, 'EXPENSE_NOT_FOUND', '삭제할 지출을 찾지 못했어요.')
    }

    db.expenses.splice(index, 1)

    return new HttpResponse(null, { status: 204 })
  }),
]
```

- [ ] **Step 12: 핸들러 모음에 등록**

`frontend/src/mocks/handlers/index.ts`:

```ts
import { entryHandlers } from './entries'
import { expenseHandlers } from './expenses'

export const handlers = [...entryHandlers, ...expenseHandlers]
```

- [ ] **Step 13: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 지출 7개를 포함해 전부 통과

- [ ] **Step 14: 커밋**

```bash
git add frontend/src frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): MSW 인메모리 스토어와 일기·지출 목 핸들러 추가"
```

---

### Task 7: 캘린더·즐겨찾기·통계 핸들러와 개발 서버 연동

**Files:**
- Create: `frontend/src/mocks/handlers/calendar.ts`
- Create: `frontend/src/mocks/handlers/favorites.ts`
- Create: `frontend/src/mocks/handlers/stats.ts`
- Create: `frontend/src/mocks/browser.ts`
- Modify: `frontend/src/mocks/handlers/index.ts`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/public/mockServiceWorker.js` (CLI가 생성)
- Test: `frontend/src/mocks/handlers/calendar.test.ts`, `frontend/src/mocks/handlers/favorites.test.ts`, `frontend/src/mocks/handlers/stats.test.ts`

**Interfaces:**
- Consumes: Task 6의 `db`/`errorResponse`, Task 5의 DTO 타입
- Produces: `/api/calendar`, `/api/favorites`, `/api/stats/categories`, `/api/stats/monthly` 목 응답. dev 모드에서 브라우저 워커가 자동 기동해 화면 작업에 실제 데이터가 흐른다.

- [ ] **Step 1: 캘린더 테스트 작성**

`frontend/src/mocks/handlers/calendar.test.ts`:

```ts
import { ApiError, apiFetch } from '@/lib/api/client'
import type { CalendarResponse } from '@/lib/api/types'

async function seedExpense(entryDate: string, amount: number) {
  await apiFetch(`/entries/${entryDate}/expenses`, {
    method: 'POST',
    body: JSON.stringify({ amount, category: '식비', memo: '테스트' }),
  })
}

describe('캘린더 목 핸들러', () => {
  it('같은 날 지출을 합산해서 준다', async () => {
    await seedExpense('2026-07-05', 3000)
    await seedExpense('2026-07-05', 4000)
    await seedExpense('2026-07-06', 1000)

    const result = await apiFetch<CalendarResponse>('/calendar?year=2026&month=07')

    expect(result.year).toBe(2026)
    expect(result.month).toBe(7)

    const fifth = result.days.find((day) => day.entryDate === '2026-07-05')
    expect(fifth?.totalAmount).toBe(7000)

    const sixth = result.days.find((day) => day.entryDate === '2026-07-06')
    expect(sixth?.totalAmount).toBe(1000)
  })

  it('다른 달 지출은 섞이지 않는다', async () => {
    await seedExpense('2026-06-30', 5000)

    const result = await apiFetch<CalendarResponse>('/calendar?year=2026&month=07')

    expect(result.days.some((day) => day.entryDate === '2026-06-30')).toBe(false)
  })

  it('즐겨찾기한 날은 지출이 없어도 포함된다', async () => {
    await apiFetch('/entries/2026-07-20/favorite', { method: 'PATCH' })

    const result = await apiFetch<CalendarResponse>('/calendar?year=2026&month=07')
    const day = result.days.find((item) => item.entryDate === '2026-07-20')

    expect(day).toEqual({ entryDate: '2026-07-20', totalAmount: 0, isFavorite: true })
  })

  it('날짜 오름차순으로 준다', async () => {
    await seedExpense('2026-07-09', 1000)
    await seedExpense('2026-07-02', 1000)

    const result = await apiFetch<CalendarResponse>('/calendar?year=2026&month=07')
    const dates = result.days.map((day) => day.entryDate)

    expect(dates).toEqual([...dates].sort())
  })

  it('연월 파라미터가 잘못되면 400을 준다', async () => {
    const error = await apiFetch('/calendar?year=2026&month=13').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'INVALID_YEAR_MONTH' })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- calendar`
Expected: FAIL — 핸들러가 없어 요청이 거부된다.

- [ ] **Step 3: 캘린더 핸들러 구현**

`frontend/src/mocks/handlers/calendar.ts`:

```ts
import { HttpResponse, http } from 'msw'
import type { CalendarDay, CalendarResponse } from '@/lib/api/types'
import { isValidYearMonth } from '@/lib/date'
import { db } from '@/mocks/db'
import { errorResponse } from './entries'

export const calendarHandlers = [
  http.get('/api/calendar', ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year') ?? ''
    const month = url.searchParams.get('month') ?? ''

    if (!isValidYearMonth(year, month)) {
      return errorResponse(400, 'INVALID_YEAR_MONTH', '연월 형식이 올바르지 않아요.')
    }

    const prefix = `${year}-${month}`
    const totals = new Map<string, CalendarDay>()

    for (const expense of db.expenses) {
      if (!expense.entryDate.startsWith(prefix)) {
        continue
      }

      const day = totals.get(expense.entryDate) ?? {
        entryDate: expense.entryDate,
        totalAmount: 0,
        isFavorite: false,
      }

      day.totalAmount += expense.amount
      totals.set(expense.entryDate, day)
    }

    for (const entry of db.entries.values()) {
      if (!entry.isFavorite || !entry.entryDate.startsWith(prefix)) {
        continue
      }

      const day = totals.get(entry.entryDate) ?? {
        entryDate: entry.entryDate,
        totalAmount: 0,
        isFavorite: false,
      }

      day.isFavorite = true
      totals.set(entry.entryDate, day)
    }

    const body: CalendarResponse = {
      year: Number(year),
      month: Number(month),
      days: [...totals.values()].sort((a, b) => a.entryDate.localeCompare(b.entryDate)),
    }

    return HttpResponse.json(body)
  }),
]
```

- [ ] **Step 4: 캘린더 테스트 통과 확인**

핸들러를 `frontend/src/mocks/handlers/index.ts`에 등록한다.

```ts
import { calendarHandlers } from './calendar'
import { entryHandlers } from './entries'
import { expenseHandlers } from './expenses'

export const handlers = [...entryHandlers, ...expenseHandlers, ...calendarHandlers]
```

Run: `npm test -- calendar`
Expected: PASS — 5개 테스트 통과

- [ ] **Step 5: 즐겨찾기 테스트 작성**

`frontend/src/mocks/handlers/favorites.test.ts`:

```ts
import { apiFetch } from '@/lib/api/client'
import type { FavoritesResponse } from '@/lib/api/types'

async function makeFavorite(entryDate: string, body: Record<string, unknown>) {
  await apiFetch(`/entries/${entryDate}`, { method: 'PUT', body: JSON.stringify(body) })
  await apiFetch(`/entries/${entryDate}/favorite`, { method: 'PATCH' })
}

describe('즐겨찾기 목 핸들러', () => {
  it('최신순으로 준다', async () => {
    await makeFavorite('2026-05-01', { moodScore: 3, gratitude: '가', noteMarkdown: null })
    await makeFavorite('2026-05-03', { moodScore: 4, gratitude: '나', noteMarkdown: null })

    const result = await apiFetch<FavoritesResponse>('/favorites')
    const dates = result.items.map((item) => item.entryDate)

    expect(dates.indexOf('2026-05-03')).toBeLessThan(dates.indexOf('2026-05-01'))
  })

  it('감사한 일이 없으면 기록 첫 줄을 미리보기로 쓴다', async () => {
    await makeFavorite('2026-05-05', {
      moodScore: 3,
      gratitude: null,
      noteMarkdown: '첫 줄이다\n둘째 줄이다',
    })

    const result = await apiFetch<FavoritesResponse>('/favorites')
    const item = result.items.find((entry) => entry.entryDate === '2026-05-05')

    expect(item?.preview).toBe('첫 줄이다')
  })

  it('감사한 일도 기록도 없으면 미리보기가 null이다', async () => {
    await apiFetch('/entries/2026-05-07/favorite', { method: 'PATCH' })

    const result = await apiFetch<FavoritesResponse>('/favorites')
    const item = result.items.find((entry) => entry.entryDate === '2026-05-07')

    expect(item?.preview).toBeNull()
  })

  it('20건 단위로 끊고 다음 커서를 준다', async () => {
    for (let index = 1; index <= 25; index += 1) {
      const day = String(index).padStart(2, '0')
      await apiFetch(`/entries/2026-04-${day}/favorite`, { method: 'PATCH' })
    }

    const first = await apiFetch<FavoritesResponse>('/favorites')
    expect(first.items).toHaveLength(20)
    expect(first.nextCursor).not.toBeNull()

    const second = await apiFetch<FavoritesResponse>(`/favorites?cursor=${first.nextCursor}`)
    const overlap = second.items.filter((item) =>
      first.items.some((prev) => prev.entryDate === item.entryDate),
    )

    expect(overlap).toHaveLength(0)
    expect(second.nextCursor).toBeNull()
  })
})
```

시드에 즐겨찾기 2건이 있으므로 마지막 테스트의 총 건수는 27건이다. 두 번째 페이지는 7건이고 그것으로 끝난다.

- [ ] **Step 6: 테스트가 실패하는지 확인**

Run: `npm test -- favorites`
Expected: FAIL — 핸들러 없음

- [ ] **Step 7: 즐겨찾기 핸들러 구현**

`frontend/src/mocks/handlers/favorites.ts`:

```ts
import { HttpResponse, http } from 'msw'
import type { DailyEntry, FavoriteItem, FavoritesResponse } from '@/lib/api/types'
import { db } from '@/mocks/db'

const PAGE_SIZE = 20

function toPreview(entry: DailyEntry): string | null {
  if (entry.gratitude) {
    return entry.gratitude
  }

  const firstLine = entry.noteMarkdown?.split('\n').find((line) => line.trim().length > 0)

  return firstLine?.trim() ?? null
}

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const cursor = new URL(request.url).searchParams.get('cursor')

    const favorites = [...db.entries.values()]
      .filter((entry) => entry.isFavorite)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
      .filter((entry) => (cursor ? entry.entryDate < cursor : true))

    const page = favorites.slice(0, PAGE_SIZE)
    const items: FavoriteItem[] = page.map((entry) => ({
      entryDate: entry.entryDate,
      moodScore: entry.moodScore,
      preview: toPreview(entry),
    }))

    const body: FavoritesResponse = {
      items,
      nextCursor: favorites.length > PAGE_SIZE ? page[page.length - 1].entryDate : null,
    }

    return HttpResponse.json(body)
  }),
]
```

커서는 마지막으로 내려준 `entryDate`다. 다음 페이지는 그보다 **작은** 날짜부터 가져온다(최신순 정렬이므로).

- [ ] **Step 8: 통계 테스트 작성**

`frontend/src/mocks/handlers/stats.test.ts`:

```ts
import { apiFetch } from '@/lib/api/client'
import type { CategoryStatsResponse, MonthlyStatsResponse } from '@/lib/api/types'
import { seedDateKey } from '@/mocks/db'

async function addExpense(entryDate: string, amount: number, category: string) {
  await apiFetch(`/entries/${entryDate}/expenses`, {
    method: 'POST',
    body: JSON.stringify({ amount, category, memo: '테스트' }),
  })
}

describe('통계 목 핸들러', () => {
  it('선택한 달의 카테고리별 합계를 준다', async () => {
    await addExpense('2026-03-01', 3000, '식비')
    await addExpense('2026-03-02', 2000, '식비')
    await addExpense('2026-03-02', 10000, '건강')

    const result = await apiFetch<CategoryStatsResponse>('/stats/categories?year=2026&month=03')

    expect(result).toMatchObject({ year: 2026, month: 3 })
    expect(result.items).toEqual(
      expect.arrayContaining([
        { category: '식비', totalAmount: 5000 },
        { category: '건강', totalAmount: 10000 },
      ]),
    )
  })

  it('지출이 없는 카테고리는 빼고 준다', async () => {
    await addExpense('2026-03-01', 3000, '식비')

    const result = await apiFetch<CategoryStatsResponse>('/stats/categories?year=2026&month=03')

    expect(result.items).toHaveLength(1)
  })

  it('기록이 없는 달은 빈 배열을 준다', async () => {
    const result = await apiFetch<CategoryStatsResponse>('/stats/categories?year=2019&month=01')

    expect(result.items).toEqual([])
  })

  it('월별 추이는 요청한 개월 수만큼 오름차순으로 준다', async () => {
    const result = await apiFetch<MonthlyStatsResponse>('/stats/monthly?months=6')

    expect(result.items).toHaveLength(6)

    const yearMonths = result.items.map((item) => item.yearMonth)
    expect(yearMonths).toEqual([...yearMonths].sort())
    expect(yearMonths[5]).toBe(seedDateKey(0).slice(0, 7))
  })

  it('months 를 생략하면 6개월이 기본이다', async () => {
    const result = await apiFetch<MonthlyStatsResponse>('/stats/monthly')

    expect(result.items).toHaveLength(6)
  })
})
```

- [ ] **Step 9: 테스트가 실패하는지 확인**

Run: `npm test -- stats`
Expected: FAIL — 핸들러 없음

- [ ] **Step 10: 통계 핸들러 구현**

`frontend/src/mocks/handlers/stats.ts`:

```ts
import { HttpResponse, http } from 'msw'
import type {
  CategoryStat,
  CategoryStatsResponse,
  MonthlyStat,
  MonthlyStatsResponse,
} from '@/lib/api/types'
import type { Category } from '@/lib/categories'
import { CATEGORIES } from '@/lib/categories'
import { isValidYearMonth } from '@/lib/date'
import { db } from '@/mocks/db'
import { errorResponse } from './entries'

const DEFAULT_MONTHS = 6

/** 오늘부터 과거로 count개월의 YYYY-MM 목록을 오름차순으로 만든다. */
function recentYearMonths(count: number): string[] {
  const now = new Date()
  const result: string[] = []

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const target = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const month = String(target.getMonth() + 1).padStart(2, '0')

    result.push(`${target.getFullYear()}-${month}`)
  }

  return result
}

export const statsHandlers = [
  http.get('/api/stats/categories', ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year') ?? ''
    const month = url.searchParams.get('month') ?? ''

    if (!isValidYearMonth(year, month)) {
      return errorResponse(400, 'INVALID_YEAR_MONTH', '연월 형식이 올바르지 않아요.')
    }

    const prefix = `${year}-${month}`
    const totals = new Map<Category, number>()

    for (const expense of db.expenses) {
      if (!expense.entryDate.startsWith(prefix)) {
        continue
      }

      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount)
    }

    const items: CategoryStat[] = CATEGORIES.filter((category) => totals.has(category)).map(
      (category) => ({ category, totalAmount: totals.get(category) ?? 0 }),
    )

    const body: CategoryStatsResponse = { year: Number(year), month: Number(month), items }

    return HttpResponse.json(body)
  }),

  http.get('/api/stats/monthly', ({ request }) => {
    const raw = new URL(request.url).searchParams.get('months')
    const months = raw === null ? DEFAULT_MONTHS : Number(raw)

    if (!Number.isInteger(months) || months < 1 || months > 24) {
      return errorResponse(400, 'INVALID_MONTHS', '조회 개월 수는 1~24 사이여야 해요.')
    }

    const items: MonthlyStat[] = recentYearMonths(months).map((yearMonth) => ({
      yearMonth,
      totalAmount: db.expenses
        .filter((expense) => expense.entryDate.startsWith(yearMonth))
        .reduce((sum, expense) => sum + expense.amount, 0),
    }))

    const body: MonthlyStatsResponse = { items }

    return HttpResponse.json(body)
  }),
]
```

- [ ] **Step 11: 핸들러 전부 등록하고 테스트 통과 확인**

`frontend/src/mocks/handlers/index.ts`:

```ts
import { calendarHandlers } from './calendar'
import { entryHandlers } from './entries'
import { expenseHandlers } from './expenses'
import { favoriteHandlers } from './favorites'
import { statsHandlers } from './stats'

export const handlers = [
  ...entryHandlers,
  ...expenseHandlers,
  ...calendarHandlers,
  ...favoriteHandlers,
  ...statsHandlers,
]
```

Run: `npm test`
Expected: PASS — 전부 통과

- [ ] **Step 12: 브라우저 워커 설치와 등록**

```bash
cd frontend && npx msw init public --save
```

`public/mockServiceWorker.js`가 생성되고 `package.json`에 `msw.workerDirectory`가 기록된다. **이 워커 파일은 커밋한다.**

`frontend/src/mocks/browser.ts`:

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 13: dev 모드에서만 워커 기동**

`frontend/src/main.tsx` 전체를 아래로 교체한다.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter } from 'react-router'
import './index.css'
import { createQueryClient } from '@/lib/queryClient'
import { routes } from '@/routes'

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

/** 백엔드 API가 생기기 전까지 개발 중에는 MSW가 /api 요청을 받는다. */
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) {
    return
  }

  const { worker } = await import('@/mocks/browser')

  await worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
```

`import.meta.env.DEV` 분기와 동적 import 덕분에 프로덕션 번들에는 MSW가 들어가지 않는다.

- [ ] **Step 14: 브라우저에서 목 서버 확인**

Run: `npm run dev` 후 `http://localhost:5173/` 접속. 개발자 도구 콘솔에 `[MSW] Mocking enabled.`가 보이는지 확인하고, 콘솔에서 아래를 실행한다.

```js
await (await fetch('/api/calendar?year=' + new Date().getFullYear() + '&month=' + String(new Date().getMonth() + 1).padStart(2, '0'))).json()
```

Expected: 시드 지출이 들어간 `days` 배열이 돌아온다.

- [ ] **Step 15: 빌드에 MSW가 섞이지 않았는지 확인**

Run: `npm run build`
Expected: 성공. 아래 명령이 아무것도 출력하지 않아야 한다.

```bash
grep -rl "Mocking enabled" frontend/dist/assets
```

- [ ] **Step 16: 커밋**

```bash
git add frontend/src frontend/public/mockServiceWorker.js frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): 캘린더·즐겨찾기·통계 목 핸들러와 dev 워커 연동"
```

---

### Task 8: Playwright E2E 스모크와 문서 갱신

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/shell.spec.ts`
- Modify: `frontend/package.json` (`test:e2e` 스크립트)
- Modify: `frontend/tsconfig.app.json` (`include`에 `e2e` 추가)
- Modify: `frontend/.gitignore`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 4의 앱 셸과 탭바, Task 7의 dev 워커
- Produces: `npm run test:e2e`로 모바일 뷰포트 E2E 실행

- [ ] **Step 1: Playwright 설치**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: 설정 파일 작성**

`frontend/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

`npm run dev`로 띄우므로 MSW 워커가 켜진 상태에서 테스트가 돈다.

- [ ] **Step 3: 실패하는 E2E 작성**

`frontend/e2e/shell.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('앱을 열면 오늘 날짜 화면으로 가고 탭으로 이동할 수 있다', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/entries\/\d{4}-\d{2}-\d{2}$/)

  const nav = page.getByRole('navigation', { name: '주요 메뉴' })
  await expect(nav.getByRole('link', { name: '오늘' })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('link', { name: '캘린더' }).click()
  await expect(page).toHaveURL(/\/calendar\/\d{4}\/\d{2}$/)
  await expect(nav.getByRole('link', { name: '캘린더' })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('link', { name: '더보기' }).click()
  await expect(page).toHaveURL(/\/more$/)
})

test('탭 링크는 44px 이상의 터치 타깃을 가진다', async ({ page }) => {
  await page.goto('/')

  const links = page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link')
  const count = await links.count()

  expect(count).toBe(3)

  for (let index = 0; index < count; index += 1) {
    const box = await links.nth(index).boundingBox()

    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})

test('목 서버가 캘린더 데이터를 응답한다', async ({ page }) => {
  await page.goto('/calendar')

  const payload = await page.evaluate(async () => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const response = await fetch(`/api/calendar?year=${now.getFullYear()}&month=${month}`)

    return response.json()
  })

  expect(Array.isArray(payload.days)).toBe(true)
  expect(payload.days.length).toBeGreaterThan(0)
})
```

- [ ] **Step 4: 스크립트와 tsconfig, gitignore 정리**

`frontend/package.json`의 `scripts`에 추가한다.

```jsonc
    "test:e2e": "playwright test",
```

`frontend/tsconfig.app.json`의 `include`를 바꾼다.

```jsonc
  "include": ["src", "e2e", "playwright.config.ts"]
```

`frontend/.gitignore` 끝에 추가한다.

```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 5: E2E 실행**

Run: `npm run test:e2e`
Expected: PASS — 3개 테스트 통과. 실패하면 `npx playwright test --headed`로 어느 단계에서 막히는지 확인한다.

- [ ] **Step 6: README 기술표 갱신**

`README.md`의 "프론트엔드" 표에 아래 네 줄을 추가한다 (Vite 행 아래).

```markdown
| React Router | 7.x | 스펙의 `/entries/:date`, `/calendar/:year/:month` URL 구조를 그대로 옮기기 위한 클라이언트 라우팅 |
| TanStack Query | 5.x | 서버 상태 캐싱·재요청·낙관적 업데이트. 지출 추가의 즉시 반영과 즐겨찾기 무한 스크롤에 사용 |
| MSW | 2.x | 백엔드 API가 완성되기 전까지 스펙의 API 계약대로 응답하는 목 서버. 개발 서버와 테스트에서 동일한 핸들러를 공유 |
```

"테스팅" 표의 프론트 E2E 행 옆에 실행 방식을 덧붙이고, 문서 하단 "마지막 업데이트"를 오늘 날짜로 바꾼다.

- [ ] **Step 7: 전체 검증**

Run: `npm run lint && npm test && npm run build && npm run test:e2e`
Expected: 네 가지 모두 통과

- [ ] **Step 8: 커밋**

```bash
git add frontend/playwright.config.ts frontend/e2e frontend/package.json frontend/package-lock.json frontend/tsconfig.app.json frontend/.gitignore README.md
git commit -m "test(frontend): 모바일 뷰포트 E2E 스모크 추가 및 기술 스택 문서 갱신"
```

---

## 완료 조건

- `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` 네 명령이 모두 통과한다.
- `npm run dev`로 띄운 화면이 아이보리 배경 + Paperlogy 폰트로 렌더되고, 하단 탭 3개로 오늘/캘린더/더보기를 오갈 수 있다.
- `/api/*` 요청 10종이 전부 MSW 목 응답을 받는다.
- 프로덕션 빌드 결과물에 MSW 코드와 사용하지 않는 폰트 굵기가 포함되지 않는다.

## 다음에 할 일 (이 계획 범위 밖)

이 토대 위에 얹을 순서다. 각각 별도 계획으로 다룬다.

1. 인증 — supabase-js 카카오 로그인, 세션 유지, 보호 라우트, `apiFetch`에 `Authorization` 헤더 주입
2. 오늘 · `가계부` 서브탭 — 지출 목록과 하단 시트 입력
3. 오늘 · `기록` 서브탭 — 기분·감사·마크다운 툴바
4. 캘린더 히트맵
5. 즐겨찾기 목록
6. 통계 (ECharts)
7. 공통 UX — 토스트, 스켈레톤, 에러 상태
