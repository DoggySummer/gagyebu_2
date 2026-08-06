import { Navigate } from 'react-router'
import { todayKey } from '@/lib/date'

/** 렌더 시점에 날짜를 계산한다. 모듈 로드 시점에 고정하면 자정을 넘겼을 때 어제로 보낸다. */
export function TodayRedirect() {
  return <Navigate to={`/entries/${todayKey()}`} replace />
}

export function CurrentMonthRedirect() {
  const today = todayKey()

  return <Navigate to={`/calendar/${today.slice(0, 4)}/${today.slice(5, 7)}`} replace />
}
