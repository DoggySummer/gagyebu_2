import { useCallback, useEffect, useState } from 'react'
import { fetchInbodyRecords } from '@/domains/inbody/api'
import type { InbodyRecordDto } from '@shared/api.types'

interface Loaded {
  records: InbodyRecordDto[]
  error: string | null
}

export function useInbodyRecords() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchInbodyRecords()
      .then((records) => {
        if (!cancelled) setLoaded({ records, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            records: [],
            error: error instanceof Error ? error.message : '불러오지 못했어요.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  return {
    records: loaded?.records ?? [],
    isLoading: loaded === null,
    loadError: loaded?.error ?? null,
    reload,
  }
}
