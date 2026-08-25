import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileTabBar from './MobileTabBar'
import { useWebSocket } from '../../hooks/useWebSocket'

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  useWebSocket()

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
