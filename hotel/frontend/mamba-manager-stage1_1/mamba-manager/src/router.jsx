import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import { RequireAuth, RequireRole } from './components/RouteGuard'
import LoginPage from './pages/LoginPage'
import ComingSoonPage from './pages/ComingSoonPage'
import DashboardPage from './features/dashboard/DashboardPage'
import OrdersPage from './features/orders/OrdersPage'
import KitchenPage from './features/kitchen/KitchenPage'
import TablesPage from './features/tables/TablesPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'kitchen', element: <KitchenPage /> },
      { path: 'tables', element: <TablesPage /> },
      { path: 'reservations', element: <ComingSoonPage title="Reservations" /> },
      {
        path: 'menu',
        element: (
          <RequireRole roles={['admin', 'manager']}>
            <ComingSoonPage title="Menu Management" />
          </RequireRole>
        ),
      },
      { path: 'payments', element: <ComingSoonPage title="Payments" /> },
      {
        path: 'analytics',
        element: (
          <RequireRole roles={['admin', 'manager']}>
            <ComingSoonPage title="Analytics" />
          </RequireRole>
        ),
      },
      {
        path: 'settings/staff',
        element: (
          <RequireRole roles={['admin', 'manager']}>
            <ComingSoonPage title="Staff Management" />
          </RequireRole>
        ),
      },
      {
        path: 'settings/floors',
        element: (
          <RequireRole roles={['admin', 'manager']}>
            <ComingSoonPage title="Floors & Tables" />
          </RequireRole>
        ),
      },
      {
        path: 'settings/tenant',
        element: (
          <RequireRole roles={['admin']}>
            <ComingSoonPage title="Tenant Settings" />
          </RequireRole>
        ),
      },
      {
        path: 'settings/upsell',
        element: (
          <RequireRole roles={['admin', 'manager']}>
            <ComingSoonPage title="Upsell Rules" />
          </RequireRole>
        ),
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
