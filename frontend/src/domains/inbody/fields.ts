import type { InbodyRecordDto } from '@shared/api.types'

export type InbodyRecord = InbodyRecordDto

/** 값이 들어가는 항목만 추린 키 */
export type MetricKey =
  | 'weight'
  | 'skeletalMuscleMass'
  | 'bodyFatMass'
  | 'bodyFatPercentage'
  | 'waistHipRatio'
  | 'visceralFatLevel'

export interface Metric {
  key: MetricKey
  label: string
  /** 값 옆에 붙는 단위. 없으면 표시하지 않는다 */
  unit: string
  /** 입력칸 오른쪽 태그. 단위가 없는 항목도 무엇을 넣는지 알려준다 */
  inputUnit: string
  decimals: number
  section: '체성분' | '비만분석'
  required: boolean
}

export const METRICS: Metric[] = [
  { key: 'weight', label: '체중', unit: 'kg', inputUnit: 'kg', decimals: 1, section: '체성분', required: true },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', inputUnit: 'kg', decimals: 1, section: '체성분', required: false },
  { key: 'bodyFatMass', label: '체지방량', unit: 'kg', inputUnit: 'kg', decimals: 1, section: '체성분', required: false },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', inputUnit: '%', decimals: 1, section: '체성분', required: false },
  { key: 'waistHipRatio', label: '복부지방율', unit: '', inputUnit: 'WHR', decimals: 2, section: '비만분석', required: false },
  { key: 'visceralFatLevel', label: '내장지방레벨', unit: '', inputUnit: '레벨', decimals: 0, section: '비만분석', required: false },
]

export const SECTIONS = ['체성분', '비만분석'] as const

export function formatMetric(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

/** 2026-08-06 → 8/6 */
export function toShortDate(dateKey: string): string {
  return `${Number(dateKey.slice(5, 7))}/${Number(dateKey.slice(8, 10))}`
}

/** 2026-08-06 → 2026.08.06 */
export function toDottedDate(dateKey: string): string {
  return dateKey.replaceAll('-', '.')
}
