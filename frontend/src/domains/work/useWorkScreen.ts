import { useCallback, useEffect, useState } from 'react'
import { deleteWorkScreen, fetchWorkScreen, setWorkFlowDone } from '@/domains/work/api'
import type { WorkScreenDetailDto } from '@shared/api.types'

interface Loaded {
  key: string
  screen: WorkScreenDetailDto | null
  error: string | null
}

export function useWorkScreen(id: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchWorkScreen(id)
      .then((screen) => {
        if (!cancelled) setLoaded({ key: id, screen, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            key: id,
            screen: null,
            error: error instanceof Error ? error.message : '불러오지 못했어요.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, reloadToken])

  const current = loaded?.key === id ? loaded : null

  const reload = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  const toggleFlow = useCallback(
    async (flowId: string, isDone: boolean) => {
      const previous = current?.screen ?? null

      // 즐겨찾기 ★ 토글과 같은 방식: 확인 절차 없이 즉시 반영하고, 실패하면 되돌린다.
      setLoaded((prev) =>
        prev && prev.key === id && prev.screen
          ? {
              ...prev,
              screen: {
                ...prev.screen,
                doneFlows: prev.screen.doneFlows + (isDone ? 1 : -1),
                flows: prev.screen.flows.map((flow) =>
                  flow.id === flowId
                    ? { ...flow, isDone, doneAt: isDone ? new Date().toISOString() : null }
                    : flow,
                ),
              },
            }
          : prev,
      )

      try {
        const updated = await setWorkFlowDone(flowId, isDone)
        setLoaded((prev) =>
          prev && prev.key === id && prev.screen
            ? {
                ...prev,
                screen: {
                  ...prev.screen,
                  flows: prev.screen.flows.map((flow) => (flow.id === flowId ? updated : flow)),
                },
              }
            : prev,
        )
      } catch (error) {
        setLoaded((prev) => (prev && prev.key === id ? { ...prev, screen: previous } : prev))
        throw error
      }
    },
    [id, current],
  )

  const remove = useCallback(async () => {
    await deleteWorkScreen(id)
  }, [id])

  return {
    screen: current?.screen ?? null,
    isLoading: current === null,
    loadError: current?.error ?? null,
    reload,
    toggleFlow,
    remove,
  }
}
