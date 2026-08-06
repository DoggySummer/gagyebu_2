import { Outlet } from 'react-router'
import { BottomTabBar } from './BottomTabBar'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-canvas">
      {/* 하단 패딩은 고정된 탭바에 콘텐츠가 가리지 않게 확보한다. */}
      <div className="mx-auto w-full max-w-[560px] px-4 pb-[calc(72px+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  )
}
