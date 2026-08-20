import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ReceiptText } from 'lucide-react';
import OrderStatusBadge from '../components/order/OrderStatusBadge';
import OrderTracker from '../components/order/OrderTracker';
import { OrderRowSkeleton } from '../components/ui/Skeleton';
import { useOrdersList, useOrderTracking } from '../hooks/useOrders';
import { formatKES } from '../hooks/useMenu';

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrdersList();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="font-display text-xl font-semibold mb-4">Your Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20">
          <ReceiptText size={36} className="text-ink-soft mb-3" />
          <p className="text-[15px] font-medium">No orders yet</p>
          <p className="text-[13px] text-ink-soft mt-1 max-w-[240px]">
            Browse our menu and place your first order!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function OrderRow({ order, expanded, onToggle }) {
  return (
    <div className="rounded-xl2 bg-cream-card shadow-card overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="tap-shrink w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="font-display font-semibold text-[15px]">Order #{order.order_number}</p>
          <p className="text-[12px] text-ink-soft mt-0.5">
            {order.item_count} item{order.item_count === 1 ? '' : 's'} · {formatKES(order.total)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={order.status} />
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown size={16} className="text-ink-soft" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && <ExpandedTracker orderId={order.id} />}
      </AnimatePresence>
    </div>
  );
}

// Split out so useOrderTracking (with its 15s polling) only runs for the
// order the guest currently has expanded, not every order in the list.
function ExpandedTracker({ orderId }) {
  const { data } = useOrderTracking(orderId);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 border-t border-line">
        {data ? (
          <OrderTracker status={data.status} items={data.items} />
        ) : (
          <div className="py-4 text-[13px] text-ink-soft">Loading status...</div>
        )}
      </div>
    </motion.div>
  );
}
