import { HTTPException } from 'hono/http-exception'
import type {
  AccountRequest,
  ExpenseRequest,
  InbodyRequest,
  PaymentMethod,
  UpdateBudgetRequest,
  UpdateReviewRequest,
  WorkFlowInput,
  WorkScreenRequest,
} from '../../shared/api.types.js'
import { isAccountCategory } from './assetCategories.js'

// 프론트 검증은 사용자 편의용일 뿐이므로 서버에서 다시 확인한다.
// 2026-08-09: 실제 가계부 스프레드시트 기준으로 갱신 — 생활비·경조사 추가, 구독료는 고정지출로 이동.
const CATEGORIES = ['생활비', '식비', '외식비', '경조사', '꾸밈비', '문화생활', '건강']
const FIXED_CATEGORIES = ['주거비', '교통비', '통신비', '보장성보험', '공부', '구독료']
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

function optionalText(value: unknown, label: string, maxLength: number): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') badRequest(`${label} 형식이 올바르지 않아요.`)
  if (value.length > maxLength) badRequest(`${label}은 ${maxLength}자까지 입력할 수 있어요.`)

  return value.trim() || null
}

function optionalDateKey(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') badRequest(`${label} 형식이 올바르지 않아요.`)

  return assertDateKey(value, label)
}

function parseWorkFlowInputs(value: unknown): WorkFlowInput[] {
  if (!Array.isArray(value)) badRequest('흐름 목록 형식이 올바르지 않아요.')

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) badRequest(`흐름 ${index + 1}번의 형식이 올바르지 않아요.`)

    const { id, description } = item as Record<string, unknown>

    if (typeof description !== 'string' || description.trim().length < 1 || description.trim().length > 300) {
      badRequest(`흐름 ${index + 1}번은 1자 이상 300자 이하로 입력해주세요.`)
    }

    if (id !== undefined && typeof id !== 'string') {
      badRequest(`흐름 ${index + 1}번의 id 형식이 올바르지 않아요.`)
    }

    return { id: id as string | undefined, description: description.trim() }
  })
}

export function parseWorkScreenRequest(body: unknown): WorkScreenRequest {
  const record = asRecord(body)
  const { title } = record

  if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 100) {
    badRequest('화면 제목은 1자 이상 100자 이하로 입력해주세요.')
  }

  return {
    title: title.trim(),
    summary: optionalText(record.summary, '요약', 500),
    unknownTerms: optionalText(record.unknownTerms, '모르는 용어', 2000),
    edgeCases: optionalText(record.edgeCases, '예외 케이스', 2000),
    deadline: optionalDateKey(record.deadline, '마감 기한'),
    flows: parseWorkFlowInputs(record.flows ?? []),
  }
}

export function parseWorkFlowToggle(body: unknown): boolean {
  const record = asRecord(body)

  if (typeof record.isDone !== 'boolean') {
    badRequest('완료 여부 값이 올바르지 않아요.')
  }

  return record.isDone
}

export interface WorkScreensCursor {
  sortKey: string
  id: string
}

/** "<sort_key>|<id>" 형태. sort_key가 NOT NULL(coalesce(deadline, 'infinity'))이라 항상 두 부분이 있다. */
export function parseWorkScreensCursor(raw: string | undefined): WorkScreensCursor | null {
  if (!raw) return null

  const separatorIndex = raw.indexOf('|')

  if (separatorIndex < 0) {
    badRequest('커서 형식이 올바르지 않아요.')
  }

  return { sortKey: raw.slice(0, separatorIndex), id: raw.slice(separatorIndex + 1) }
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

/** 월 설정(수입 + 고정지출 6종)은 두 값을 한 화면에서 같이 저장한다. */
export function parseBudgetRequest(body: unknown): UpdateBudgetRequest {
  const record = asRecord(body)
  const { income, fixedExpenses } = record

  if (typeof income !== 'number' || !Number.isInteger(income) || income < 0 || income > 1_000_000_000) {
    badRequest('수입은 0원 이상 10억원 이하의 정수여야 해요.')
  }

  if (!Array.isArray(fixedExpenses)) {
    badRequest('고정지출 형식이 올바르지 않아요.')
  }

  const items = fixedExpenses.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      badRequest(`고정지출 ${index + 1}번의 형식이 올바르지 않아요.`)
    }

    const { category, amount } = item as Record<string, unknown>

    if (typeof category !== 'string' || !FIXED_CATEGORIES.includes(category)) {
      badRequest(`고정지출 ${index + 1}번의 카테고리가 올바르지 않아요.`)
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0 || amount > 100_000_000) {
      badRequest(`${category}의 금액은 0원 이상 1억원 이하의 정수여야 해요.`)
    }

    return { category, amount }
  })

  const seen = new Set(items.map((item) => item.category))

  if (seen.size !== items.length) {
    badRequest('고정지출 카테고리가 중복됐어요.')
  }

  return { income, fixedExpenses: items }
}
