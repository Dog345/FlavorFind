import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as ordersApi from '../../api/orders'
import { unwrapCollection } from '../../api/client'
import { demoOrdersList } from '../../lib/demoData'

const demoKitchenOrders = demoOrdersList
  .filter((o) => ['confirmed', 'preparing'].includes(o.status))
  .slice(0, 6)

export function useKitchenOrders() {
  const query = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: ordersApi.getKitchenOrders,
    retry: 1,
    refetchInterval: 30_000, // fallback poll per spec, WS updates invalidate this too
  })

  if (query.isError) {
    return { orders: demoKitchenOrders, isLoading: false, isDemo: true }
  }
  const { items } = unwrapCollection(query.data)
  return { orders: items, isLoading: query.isLoading, isDemo: false }
}

export function useUpdateItemStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, itemId, status }) => ordersApi.updateOrderItemStatus(orderId, itemId, status),
    onMutate: async ({ orderId, itemId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['kitchen-orders'] })
      const previous = queryClient.getQueryData(['kitchen-orders'])
      queryClient.setQueryData(['kitchen-orders'], (old) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((o) =>
            o.id === orderId
              ? { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, status } : i)) }
              : o
          ),
        }
      })
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['kitchen-orders'], context.previous)
      toast.error(err?.response?.data?.message ?? 'Could not update item status')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  })
}

export function useMarkOrderReady() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId) => ordersApi.updateOrderStatus(orderId, 'ready'),
    onSuccess: () => {
      toast.success('Order marked ready')
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not update order'),
  })
}
