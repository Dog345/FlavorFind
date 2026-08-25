import { ChefHat } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBoundary from '../../components/ErrorBoundary'
import { useKitchenOrders, useUpdateItemStatus, useMarkOrderReady } from './useKitchen'
import KitchenOrderCard from './KitchenOrderCard'

export default function KitchenPage() {
  const { orders, isLoading, isDemo } = useKitchenOrders()
  const updateItemStatus = useUpdateItemStatus()
  const markReady = useMarkOrderReady()

  // Oldest first (FIFO), per spec
  const sorted = [...(orders ?? [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-73px)] bg-[#101216] px-4 py-6 lg:-mx-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Kitchen Display</h1>
            <p className="text-sm text-white/40">{sorted.length} active orders</p>
          </div>
        </div>
        {isDemo && (
          <span className="rounded-full bg-warning-500/15 px-3 py-1.5 text-xs font-semibold text-warning-500">
            Showing sample data
          </span>
        )}
      </div>

      <ErrorBoundary>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl bg-white/5 p-4">
            <EmptyState
              icon={ChefHat}
              title="No active orders"
              description="Confirmed and preparing orders will appear here."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                onItemStatus={(orderId, itemId, status) => updateItemStatus.mutate({ orderId, itemId, status })}
                onMarkReady={(orderId) => markReady.mutate(orderId)}
                markingReady={markReady.isPending}
              />
            ))}
          </div>
        )}
      </ErrorBoundary>
    </div>
  )
}
