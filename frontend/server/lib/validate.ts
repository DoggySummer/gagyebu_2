import { HTTPException } from 'hono/http-exception'
import type {
  ExpenseRequest,
  InbodyRequest,
  PaymentMethod,
  UpdateReviewRequest,
} from '../../shared/api.types.js'

// 프론트 검증은 사용자 편의용일 뿐이므로 서버에서 다시 확인한다.
const CATEGORIES = ['식비', '외식비', '꾸밈비', '문화생활', '구독료', '건강']
const PAYMENT_METHODS: PaymentMethod[] = ['card', 'cash', 'transfer']

export function badRequest(message: string): never {
  throw new HTTPException(400, { message })
}

export function assertDateKey(value: string | undefined, label = '날짜'): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    badRequest(`${label} 형식이 올바르지 않아요.`)
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    badRequest(`${label}가 존재하지 않는 날짜예요.`)
  }

  return value
}

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null) {
    badRequest('요청 본문이 올바르지 않아요.')
  }

  return body as Record<string, unknown>
}

function optionalNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) badRequest(`${label} 값이 올바르지 않아요.`)

  return value
}

export function parseExpenseRequest(body: unknown): ExpenseRequest {
  const record = asRecord(body)
  const { amount, category, memo, paymentMethod } = record

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1 || amount > 100_000_000) {
    badRequest('금액은 1원 이상 1억원 이하의 정수여야 해요.')
  }

  if (typeof category !== 'string' || !CATEGORIES.includes(category)) {
    badRequest('카테고리가 올바르지 않아요.')
  }

  if (typeof memo !== 'string' || memo.trim().length < 1 || memo.trim().length > 100) {
    badRequest('메모는 1자 이상 100자 이하로 입력해주세요.')
  }

  if (
    paymentMethod !== null &&
    paymentMethod !== undefined &&
    !PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)
  ) {
    badRequest('결제수단이 올바르지 않아요.')
  }

  return {
    amount,
    category,
    memo: memo.trim(),
    paymentMethod: (paymentMethod as PaymentMethod | null | undefined) ?? null,
  }
}

export function parseEntryRequest(body: unknown) {
  const record = asRecord(body)
  const moodScore = optionalNumber(record.moodScore, '기분 점수')

  if (moodScore !== null && (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 5)) {
    badRequest('기분 점수는 1~5 사이여야 해요.')
  }

  const gratitude = record.gratitude
  const noteMarkdown = record.noteMarkdown

  if (gratitude !== null && gratitude !== undefined && typeof gratitude !== 'string') {
    badRequest('감사한 일 형식이 올바르지 않아요.')
  }

  if (noteMarkdown !== null && noteMarkdown !== undefined && typeof noteMarkdown !== 'string') {
    badRequest('기록 형식이 올바르지 않아요.')
  }

  if (typeof gratitude === 'string' && gratitude.length > 200) {
    badRequest('감사한 일은 200자까지 입력할 수 있어요.')
  }

  if (typeof noteMarkdown === 'string' && noteMarkdown.length > 10_000) {
    badRequest('기록은 10,000자까지 입력할 수 있어요.')
  }

  return {
    moodScore,
    gratitude: (gratitude as string | null | undefined) ?? null,
    noteMarkdown: (noteMarkdown as string | null | undefined) ?? null,
  }
}

export function parseFavoriteRequest(body: unknown): boolean {
  const record = asRecord(body)

  if (typeof record.isFavorite !== 'boolean') {
    badRequest('즐겨찾기 값이 올바르지 않아요.')
  }

  return record.isFavorite
}

export function parseInbodyRequest(body: unknown): InbodyRequest {
  const record = asRecord(body)
  const measuredAt = assertDateKey(record.measuredAt as string | undefined, '측정 날짜')

  const weight = optionalNumber(record.weight, '체중')

  if (weight === null || weight <= 0) {
    badRequest('체중을 입력해주세요.')
  }

  const bodyFatPercentage = optionalNumber(record.bodyFatPercentage, '체지방률')

  if (bodyFatPercentage !== null && (bodyFatPercentage < 0 || bodyFatPercentage > 100)) {
    badRequest('체지방률은 0~100 사이여야 해요.')
  }

  const visceralFatLevel = optionalNumber(record.visceralFatLevel, '내장지방레벨')

  if (visceralFatLevel !== null && (!Number.isInteger(visceralFatLevel) || visceralFatLevel < 1 || visceralFatLevel > 30)) {
    badRequest('내장지방레벨은 1~30 사이의 정수여야 해요.')
  }

  return {
    measuredAt,
    weight,
    skeletalMuscleMass: optionalNumber(record.skeletalMuscleMass, '골격근량'),
    bodyFatMass: optionalNumber(record.bodyFatMass, '체지방량'),
    bodyFatPercentage,
    waistHipRatio: optionalNumber(record.waistHipRatio, '복부지방율'),
    visceralFatLevel,
  }
}

export function parseYearMonth(year: string | undefined, month: string | undefined) {
  if (!year || !month || !/^\d{4}$/.test(year) || !/^(0?[1-9]|1[0-2])$/.test(month)) {
    badRequest('연월이 올바르지 않아요.')
  }

  return { year: Number(year), month: Number(month) }
}

/** 'YYYY-MM' 형식의 두 자리 월만 받는다. */
export function assertMonthKey(value: string | undefined): string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    badRequest('연월 형식이 올바르지 않아요.')
  }

  return value
}

export function parseReviewRequest(body: unknown): UpdateReviewRequest {
  const record = asRecord(body)
  const noteMarkdown = record.noteMarkdown

  if (noteMarkdown !== null && noteMarkdown !== undefined && typeof noteMarkdown !== 'string') {
    badRequest('회고 형식이 올바르지 않아요.')
  }

  if (typeof noteMarkdown === 'string' && noteMarkdown.length > 10_000) {
    badRequest('회고는 10,000자까지 입력할 수 있어요.')
  }

  return { noteMarkdown: (noteMarkdown as string | null | undefined) ?? null }
}
