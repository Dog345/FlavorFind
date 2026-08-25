import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChefHat as LogoIcon, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { NAV_ITEMS, filterNavByRole } from './navConfig'

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const role = useAuthStore((s) => s.user?.role)
  const tenant = useAuthStore((s) => s.tenant)
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'))

  const items = filterNavByRole(NAV_ITEMS, role ?? 'waiter')

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-border bg-white px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-500/30">
            <LogoIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink-900">{tenant?.name ?? 'Mamba Hotel'}</p>
            <p className="text-xs text-ink-400">Manager Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
          {items.map((item) => {
            const isSettings = !!item.children
            const active =
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to))

            if (isSettings) {
              return (
                <div key={item.to}>
                  <button
                    onClick={() => setSettingsOpen((o) => !o)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : 'text-ink-500 hover:bg-surface'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {settingsOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-surface-border pl-4">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive ? 'font-semibold text-brand-500' : 'text-ink-400 hover:text-ink-700'
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : 'text-ink-500 hover:bg-surface'
                  }`
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <button className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 hover:bg-surface">
          <HelpCircle className="h-[18px] w-[18px]" />
          Get Help
        </button>
      </aside>
    </>
  )
}
