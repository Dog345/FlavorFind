import { useState } from 'react'
import { Search, Bell, ChevronDown, LogOut, Menu, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useTenantStore } from '../../stores/tenantStore'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ onOpenMobileNav }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const wsStatus = useTenantStore((s) => s.wsStatus)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-surface-border bg-surface/80 px-4 py-4 backdrop-blur-sm lg:px-8">
      <button
        onClick={onOpenMobileNav}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-white lg:hidden"
      >
        <Menu className="h-5 w-5 text-ink-700" />
      </button>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="What do you want today..."
          className="h-11 w-full rounded-2xl border border-surface-border bg-white pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div
          title={wsStatus === 'connected' ? 'Live updates connected' : 'Live updates offline'}
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex ${
            wsStatus === 'connected' ? 'bg-success-50 text-success-500' : 'bg-ink-900/5 text-ink-400'
          }`}
        >
          {wsStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {wsStatus === 'connected' ? 'Live' : 'Offline'}
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-white">
          <Bell className="h-[18px] w-[18px] text-ink-700" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden text-sm font-semibold text-ink-900 sm:block">{user?.name ?? 'User'}</span>
            <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-surface-border bg-white p-1.5 shadow-lg">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs capitalize text-ink-400">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-500 hover:bg-danger-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
