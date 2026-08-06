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
