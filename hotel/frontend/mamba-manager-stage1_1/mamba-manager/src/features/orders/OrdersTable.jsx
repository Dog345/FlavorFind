import { MoreHorizontal, Eye, XCircle, CreditCard } from 'lucide-react'
import { useState } from 'react'
import Badge from '../../components/ui/Badge'
import { SkeletonRows } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { ClipboardList } from 'lucide-react'
import { formatKES, formatDateTime } from '../../lib/format'

export default function OrdersTable({ orders, loading, onView, onCancel, onTakePayment, canManage }) {
  const [openMenuId, setOpenMenuId] = useState(null)

  if (loading) return <SkeletonRows rows={8} />

  if (!orders?.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No orders match these filters"
        description="Try a different status or date range."
      />
    )
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-400">
            <th className="pb-3 font-semibold">Order#</th>
            <th className="pb-3 font-semibold">Table</th>
            <th className="pb-3 font-semibold">Waiter</th>
            <th className="pb-3 font-semibold">Items</th>
            <th className="pb-3 font-semibold">Total</th>
            <th className="pb-3 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Created</th>
            <th className="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {orders.map((order) => (
            <tr key={order.id} className="text-ink-700">
              <td className="py-3 font-semibold text-ink-900">{order.order_number}</td>
              <td className="py-3">{order.table}</td>
              <td className="py-3 text-ink-500">{order.waiter ?? '—'}</td>
              <td className="py-3 text-ink-500">{order.items_count ?? order.items?.length ?? 0}</td>
              <td className="py-3 font-semibold">{formatKES(order.total)}</td>
              <td className="py-3">
                <Badge status={order.status} />
              </td>
              <td className="py-3 text-ink-400">{formatDateTime(order.created_at)}</td>
              <td className="py-3 text-right">
                <div className="relative inline-block">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-surface"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {openMenuId === order.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-surface-border bg-white p-1.5 shadow-lg">
                        <button
                          onClick={() => {
                            onView(order)
                            setOpenMenuId(null)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface"
                        >
                          <Eye className="h-4 w-4" /> View details
                        </button>
                        {order.status === 'served' && canManage && (
                          <button
                            onClick={() => {
                              onTakePayment(order)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface"
                          >
                            <CreditCard className="h-4 w-4" /> Take payment
                          </button>
                        )}
                        {!['paid', 'cancelled'].includes(order.status) && canManage && (
                          <button
                            onClick={() => {
                              onCancel(order)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-500 hover:bg-danger-50"
                          >
                            <XCircle className="h-4 w-4" /> Cancel order
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
