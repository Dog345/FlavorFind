import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { NAV_ITEMS, filterNavByRole, MOBILE_TAB_KEYS } from './navConfig'

export default function MobileTabBar() {
  const role = useAuthStore((s) => s.user?.role)
  const items = filterNavByRole(NAV_ITEMS, role ?? 'waiter').filter((i) =>
    MOBILE_TAB_KEYS.includes(i.to)
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-surface-border bg-white px-2 py-2 lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium ${
              isActive ? 'text-brand-500' : 'text-ink-400'
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label.split(' ')[0]}
        </NavLink>
      ))}
    </nav>
  )
}
