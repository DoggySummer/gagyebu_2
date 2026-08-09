/**
 * 클라이언트와 서버가 함께 쓰는 API 계약.
 *
 * DB 로우 타입(database.types.ts)과 반드시 분리한다. 로우는 snake_case에 감사 컬럼까지
 * 들고 있지만, API 응답은 화면이 필요한 것만 camelCase로 준다. 컬럼을 바꿔도
 * 이 계약이 그대로면 화면을 고칠 필요가 없다.
 */

export type PaymentMethod = 'card' | 'cash' | 'transfer'

export interface ExpenseDto {
  id: string
  entryDate: string
  amount: number
  category: string
  memo: string
  paymentMethod: PaymentMethod | null
}

export interface DailyEntryDto {
  entryDate: string
  moodScore: number | null
  gratitude: string | null
  noteMarkdown: string | null
  isFavorite: boolean
}

/** GET /api/entries/:date */
export interface DailyLogDto {
  entry: DailyEntryDto | null
  expenses: ExpenseDto[]
}

/** PUT /api/entries/:date */
export interface UpdateEntryRequest {
  moodScore: number | null
  gratitude: string | null
  noteMarkdown: string | null
}

/** PATCH /api/entries/:date/favorite */
export interface UpdateFavoriteRequest {
  isFavorite: boolean
}

/** POST /api/entries/:date/expenses, PATCH /api/expenses/:id */
export interface ExpenseRequest {
  amount: number
  category: string
  memo: string
  paymentMethod: PaymentMethod | null
}

export interface CalendarDayDto {
  entryDate: string
  totalAmount: number
  isFavorite: boolean
}

/** GET /api/calendar?year=&month= */
export interface CalendarSummaryDto {
  year: number
  month: number
  days: CalendarDayDto[]
  /** 히트맵 단계 계산 기준이 되는 그 달의 일별 최대 지출 */
  maxTotal: number
}

export interface CategoryTotalDto {
  category: string
  amount: number
}

export interface MoodCountDto {
  score: number
  count: number
}

/** PUT /api/reviews/:month (month = YYYY-MM) */
export interface UpdateReviewRequest {
  noteMarkdown: string | null
}

export interface MonthlyReviewDto {
  /** YYYY-MM */
  month: string
  noteMarkdown: string | null
}

/** GET /api/calendar/overview?year=&month= — 캘린더 하단 월간 평가 섹션 전용 */
export interface MonthOverviewDto {
  year: number
  month: number
  totalAmount: number
  /** 전월 데이터가 아예 없으면 null (증감률을 계산할 기준이 없음) */
  previousMonthAmount: number | null
  topCategory: CategoryTotalDto | null
  moodCounts: MoodCountDto[]
  /** moodCounts 의 총합. 감정 분포 섹션의 "N일 기록됨" 표시에 쓴다 */
  recordedMoodDays: number
  review: MonthlyReviewDto | null
}

export interface FavoriteItemDto {
  entryDate: string
  moodScore: number | null
  /** 오늘의 기록(본문) 첫 줄 우선, 없으면 감사한 일. 마크다운 기호는 지운 평문. 없으면 null */
  preview: string | null
}

/** GET /api/favorites?cursor= */
export interface FavoritesResponse {
  items: FavoriteItemDto[]
  /** 다음 페이지 요청에 그대로 넘길 값. 더 없으면 null */
  nextCursor: string | null
}

export interface InbodyRecordDto {
  id: string
  measuredAt: string
  weight: number
  skeletalMuscleMass: number | null
  bodyFatMass: number | null
  bodyFatPercentage: number | null
  waistHipRatio: number | null
  visceralFatLevel: number | null
}

/** POST /api/inbody */
export interface InbodyRequest {
  measuredAt: string
  weight: number
  skeletalMuscleMass: number | null
  bodyFatMass: number | null
  bodyFatPercentage: number | null
  waistHipRatio: number | null
  visceralFatLevel: number | null
}

export interface WorkFlowDto {
  id: string
  sortOrder: number
  description: string
  isDone: boolean
  doneAt: string | null
}

export interface WorkScreenSummaryDto {
  id: string
  title: string
  summary: string | null
  deadline: string | null
  totalFlows: number
  doneFlows: number
}

export interface WorkScreenDetailDto extends WorkScreenSummaryDto {
  unknownTerms: string | null
  edgeCases: string | null
  createdAt: string
  updatedAt: string
  flows: WorkFlowDto[]
}

/** GET /api/work/screens?cursor= */
export interface WorkScreensResponse {
  items: WorkScreenSummaryDto[]
  nextCursor: string | null
}

/** 입력 화면의 흐름 한 줄. id가 있으면 기존 흐름 수정(완료 상태 보존), 없으면 새로 생성 */
export interface WorkFlowInput {
  id?: string
  description: string
}

/** POST /api/work/screens, PUT /api/work/screens/:id */
export interface WorkScreenRequest {
  title: string
  summary: string | null
  unknownTerms: string | null
  edgeCases: string | null
  deadline: string | null
  flows: WorkFlowInput[]
}

/** PATCH /api/work/flows/:id */
export interface UpdateWorkFlowRequest {
  isDone: boolean
}

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

/** 모든 4xx·5xx 응답의 본문 형태 */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
