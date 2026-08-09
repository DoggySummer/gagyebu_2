import { useCallback, useEffect, useState } from 'react'
import { fetchAssetsSummary, fetchNetWorthTrend } from '@/domains/assets/api'
import type { AssetsSummaryDto, NetWorthSnapshotDto } from '@shared/api.types'

interface Loaded {
  summary: AssetsSummaryDto
  trend: NetWorthSnapshotDto[]
}

export function useAssets() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchAssetsSummary(), fetchNetWorthTrend()])
      .then(([summary, trend]) => {
        if (!cancelled) setLoaded({ summary, trend })
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '불러오지 못했어요.')
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = useCallback(() => {
    setLoaded(null)
    setLoadError(null)
    setReloadToken((token) => token + 1)
  }, [])

  return {
    summary: loaded?.summary ?? null,
    trend: loaded?.trend ?? [],
    isLoading: loaded === null && !loadError,
    loadError,
    reload,
  }
}
