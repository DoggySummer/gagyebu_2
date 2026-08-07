import { useCallback, useEffect, useState } from 'react'
import { fetchMonthOverview } from '@/domains/calendar/reviewApi'
import type { MonthOverviewDto } from '@shared/api.types'

interface Loaded {
  key: string
  overview: MonthOverviewDto | null
  error: string | null
}

export function useMonthOverview(year: number, month: number) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const key = `${year}-${month}`

  useEffect(() => {
    let cancelled = false

    fetchMonthOverview(year, month)
      .then((overview) => {
        if (!cancelled) setLoaded({ key, overview, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            key,
            overview: null,
            error: error instanceof Error ? error.message : '불러오지 못했어요.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [year, month, key, reloadToken])

  const current = loaded?.key === key ? loaded : null

  const reload = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  /** 회고를 저장하면 서버를 다시 안 불러도 바로 반영되게 로컬 상태를 갱신한다. */
  const applyReview = useCallback(
    (savedMonth: string, noteMarkdown: string | null) => {
      setLoaded((prev) =>
        prev && prev.key === key && prev.overview
          ? { ...prev, overview: { ...prev.overview, review: { month: savedMonth, noteMarkdown } } }
          : prev,
      )
    },
    [key],
  )

  return {
    overview: current?.overview ?? null,
    isLoading: current === null,
    loadError: current?.error ?? null,
    reload,
    applyReview,
  }
}
