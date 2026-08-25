import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { SkeletonRows } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { ClipboardList } from 'lucide-react'
import { formatKES, timeAgo } from '../../lib/format'

export default function RecentOrdersTable({ orders, loading }) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink-900">Recent orders</h3>
        <Link to="/orders" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
          View all
        </Link>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : !orders?.length ? (
        <EmptyState icon={ClipboardList} title="No orders yet today" description="New orders will show up here as they come in." />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-3 font-semibold">Order</th>
                <th className="pb-3 font-semibold">Table</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {orders.map((order) => (
                <tr key={order.id} className="text-ink-700">
                  <td className="py-3 font-semibold text-ink-900">{order.order_number}</td>
                  <td className="py-3 text-ink-500">{order.table}</td>
                  <td className="py-3">
                    <Badge status={order.status} />
                  </td>
                  <td className="py-3 font-semibold">{formatKES(order.total)}</td>
                  <td className="py-3 text-ink-400">{timeAgo(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
