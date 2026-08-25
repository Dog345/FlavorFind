import {
  LayoutGrid,
  ClipboardList,
  ChefHat,
  LayoutPanelTop,
  CalendarDays,
  UtensilsCrossed,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react'

// role visibility straight from the spec's navigation structure
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, roles: ['admin', 'manager', 'waiter', 'kitchen', 'cashier'] },
  { to: '/orders', label: 'Orders', icon: ClipboardList, roles: ['admin', 'manager', 'waiter', 'kitchen', 'cashier'] },
  { to: '/kitchen', label: 'Kitchen (KDS)', icon: ChefHat, roles: ['admin', 'manager', 'waiter', 'kitchen', 'cashier'] },
  { to: '/tables', label: 'Tables', icon: LayoutPanelTop, roles: ['admin', 'manager', 'waiter'] },
  { to: '/reservations', label: 'Reservations', icon: CalendarDays, roles: ['admin', 'manager', 'waiter'] },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed, roles: ['admin', 'manager'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'manager', 'cashier'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'manager'] },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'manager'],
    children: [
      { to: '/settings/staff', label: 'Staff', roles: ['admin', 'manager'] },
      { to: '/settings/floors', label: 'Floors & Tables', roles: ['admin', 'manager'] },
      { to: '/settings/tenant', label: 'Tenant Info', roles: ['admin'] },
      { to: '/settings/upsell', label: 'Upsell Rules', roles: ['admin', 'manager'] },
    ],
  },
]

export function filterNavByRole(items, role) {
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((c) => c.roles.includes(role)),
    }))
}

// Primary items shown in the mobile bottom tab bar (kept short by design)
export const MOBILE_TAB_KEYS = ['/', '/orders', '/kitchen', '/tables', '/payments']
