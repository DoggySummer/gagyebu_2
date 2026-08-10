import { useCallback, useEffect, useState } from 'react'
import { fetchExpenseStats } from '@/domains/stats/api'
import type { ExpenseStatsDto } from '@shared/api.types'

interface Loaded {
  key: string
  stats: ExpenseStatsDto | null
  error: string | null
}

export function useExpenseStats(year: number, month: number) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const key = `${year}-${month}`

  useEffect(() => {
    let cancelled = false

    fetchExpenseStats(year, month)
      .then((stats) => {
        if (!cancelled) setLoaded({ key, stats, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            key,
            stats: null,
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

  return {
    stats: current?.stats ?? null,
    isLoading: current === null,
    loadError: current?.error ?? null,
    reload,
  }
}
