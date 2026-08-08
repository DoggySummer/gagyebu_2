import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWorkScreens } from '@/domains/work/api'
import type { WorkScreenSummaryDto } from '@shared/api.types'

interface State {
  items: WorkScreenSummaryDto[]
  cursor: string | null
  hasMore: boolean
  isLoading: boolean
  error: string | null
}

const INITIAL: State = { items: [], cursor: null, hasMore: true, isLoading: true, error: null }

/** 마감임박순 20건 커서 무한 스크롤. 즐겨찾기 목록과 같은 패턴. */
export function useWorkScreens() {
  const [state, setState] = useState<State>(INITIAL)
  const isFetching = useRef(false)

  const load = useCallback(async (cursor: string | null) => {
    if (isFetching.current) return
    isFetching.current = true
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const page = await fetchWorkScreens(cursor)
      setState((prev) => ({
        items: cursor ? [...prev.items, ...page.items] : page.items,
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '불러오지 못했어요.',
      }))
    } finally {
      isFetching.current = false
    }
  }, [])

  useEffect(() => {
    void load(null)
  }, [load])

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (prev.hasMore && !isFetching.current) void load(prev.cursor)
      return prev
    })
  }, [load])

  const retry = useCallback(() => {
    setState((prev) => {
      void load(prev.items.length > 0 ? prev.cursor : null)
      return prev
    })
  }, [load])

  return {
    items: state.items,
    isInitialLoading: state.isLoading && state.items.length === 0,
    isLoadingMore: state.isLoading && state.items.length > 0,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    retry,
  }
}
