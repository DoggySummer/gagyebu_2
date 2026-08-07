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

/** 모든 4xx·5xx 응답의 본문 형태 */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
