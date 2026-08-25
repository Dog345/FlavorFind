import { DollarSign, ClipboardList, LayoutPanelTop, Clock } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import ErrorBoundary from '../../components/ErrorBoundary'
import DemoDataBanner from '../../components/ui/DemoDataBanner'
import KpiCard from './KpiCard'
import RevenueChart from './RevenueChart'
import StatusFunnelChart from './StatusFunnelChart'
import PaymentBreakdownChart from './PaymentBreakdownChart'
import RecentOrdersTable from './RecentOrdersTable'
import {
  useTenantStats,
  useRevenueSeries,
  useStatusFunnel,
  usePaymentBreakdown,
  useRecentOrders,
} from './useDashboardData'
import { formatKES } from '../../lib/format'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const stats = useTenantStats()
  const revenue = useRevenueSeries()
  const funnel = useStatusFunnel()
  const payments = usePaymentBreakdown()
  const recentOrders = useRecentOrders()

  const isDemo = [stats, revenue, funnel, payments, recentOrders].some((q) => q.isDemo)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-ink-400">Your daily dashboard report is here.</p>
      </div>

      {isDemo && <DemoDataBanner />}

      <ErrorBoundary>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={DollarSign} label="Today's Revenue" value={formatKES(stats.data?.revenue_today)} loading={stats.isLoading} />
          <KpiCard icon={ClipboardList} label="Orders Today" value={stats.data?.orders_today} loading={stats.isLoading} />
          <KpiCard icon={LayoutPanelTop} label="Active Tables" value={stats.data?.active_sessions} loading={stats.isLoading} />
          <KpiCard icon={Clock} label="Pending Orders" value={stats.data?.pending_orders} loading={stats.isLoading} />
        </div>
      </ErrorBoundary>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ErrorBoundary>
          <div className="xl:col-span-2">
            <RevenueChart data={revenue.data} loading={revenue.isLoading} />
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <PaymentBreakdownChart data={payments.data} loading={payments.isLoading} />
        </ErrorBoundary>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ErrorBoundary>
          <div className="xl:col-span-1">
            <StatusFunnelChart data={funnel.data} loading={funnel.isLoading} />
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="xl:col-span-2">
            <RecentOrdersTable orders={recentOrders.data} loading={recentOrders.isLoading} />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}
