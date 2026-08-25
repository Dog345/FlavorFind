import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ErrorBoundary from '../../components/ErrorBoundary'
import DemoDataBanner from '../../components/ui/DemoDataBanner'
import { useAuthStore } from '../../stores/authStore'
import OrdersFilters from './OrdersFilters'
import OrdersTable from './OrdersTable'
import OrderDetailDrawer from './OrderDetailDrawer'
import NewOrderModal from './NewOrderModal'
import PaymentModal from '../payments/PaymentModal'
import { useOrdersList, useUpdateOrderStatus, useCancelOrder } from './useOrders'

export default function OrdersPage() {
  const role = useAuthStore((s) => s.user?.role)
  const canManage = ['admin', 'manager', 'waiter'].includes(role)
  const canCreate = ['admin', 'manager', 'waiter'].includes(role)

  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    table: searchParams.get('table') ?? '',
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentOrder, setPaymentOrder] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  const { items: orders, isLoading, isDemo } = useOrdersList(filters)
  const updateStatus = useUpdateOrderStatus()
  const cancelOrder = useCancelOrder()

  const filteredOrders = filters.table
    ? orders.filter((o) => o.table.toLowerCase().includes(filters.table.toLowerCase()))
    : orders

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
          <p className="mt-1 text-sm text-ink-400">Manage and track every order across the floor.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setNewOrderOpen(true)}>
            <Plus className="h-4 w-4" />
            New order
          </Button>
        )}
      </div>

      {isDemo && <DemoDataBanner />}

      <div className="card p-5 lg:p-6">
        <OrdersFilters filters={filters} onChange={setFilters} />
        <ErrorBoundary>
          <OrdersTable
            orders={filteredOrders}
            loading={isLoading}
            canManage={canManage}
            onView={setSelectedOrder}
            onCancel={setCancelTarget}
            onTakePayment={setPaymentOrder}
          />
        </ErrorBoundary>
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        canManage={canManage}
        onAdvanceStatus={(order, status) => {
          updateStatus.mutate({ id: order.id, status })
          setSelectedOrder(null)
        }}
        onTakePayment={(order) => {
          setSelectedOrder(null)
          setPaymentOrder(order)
        }}
      />

      <PaymentModal order={paymentOrder} open={!!paymentOrder} onClose={() => setPaymentOrder(null)} />

      <NewOrderModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={`Cancel order ${cancelTarget?.order_number}?`}
        description="This cannot be undone. The kitchen and floor staff will be notified."
        confirmLabel="Cancel order"
        loading={cancelOrder.isPending}
        onConfirm={() =>
          cancelOrder.mutate(cancelTarget.id, { onSuccess: () => setCancelTarget(null) })
        }
      />
    </div>
  )
}
