import { useCallback, useEffect, useState } from 'react'
import { fetchMonthSummary, type MonthSummary } from '@/domains/calendar/api'

interface Loaded {
  key: string
  summary: MonthSummary | null
  error: string | null
}

const EMPTY: MonthSummary = { totals: {}, favorites: new Set(), max: 0 }

export function useMonthSummary(userId: string, year: number, month: number) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const key = `${userId}:${year}-${month}`

  useEffect(() => {
    let cancelled = false

    fetchMonthSummary(userId, year, month)
      .then((summary) => {
        if (!cancelled) setLoaded({ key, summary, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            key,
            summary: null,
            error: error instanceof Error ? error.message : '불러오지 못했어요.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId, year, month, key, reloadToken])

  // 월이 바뀌면 아직 이전 달 데이터를 들고 있으므로 로딩으로 취급한다.
  const current = loaded?.key === key ? loaded : null

  const reload = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  return {
    summary: current?.summary ?? EMPTY,
    isLoading: current === null,
    loadError: current?.error ?? null,
    reload,
  }
}
