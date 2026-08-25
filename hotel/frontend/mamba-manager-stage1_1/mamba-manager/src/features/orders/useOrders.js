import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as ordersApi from '../../api/orders'
import { demoOrdersList, demoOpenSessions, demoMenuCategories } from '../../lib/demoData'
import { unwrapCollection } from '../../api/client'

export function useOrdersList(filters) {
  const query = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters),
    retry: 1,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })

  if (query.isError) {
    return { items: demoOrdersList, meta: null, isLoading: false, isDemo: true }
  }
  const { items, meta } = unwrapCollection(query.data)
  return { items, meta, isLoading: query.isLoading, isDemo: false }
}

export function useOpenSessions(enabled) {
  const query = useQuery({
    queryKey: ['open-sessions'],
    queryFn: ordersApi.getOpenSessions,
    enabled,
    retry: 1,
  })
  if (query.isError) return { items: demoOpenSessions, isDemo: true }
  const { items } = unwrapCollection(query.data)
  return { items: items.length ? items : demoOpenSessions, isDemo: !items.length }
}

export function useMenuForOrder(enabled) {
  const query = useQuery({
    queryKey: ['menu-for-order'],
    queryFn: ordersApi.getMenuForOrder,
    enabled,
    retry: 1,
  })
  if (query.isError) return { categories: demoMenuCategories, isDemo: true }
  const { items } = unwrapCollection(query.data)
  return { categories: items.length ? items : demoMenuCategories, isDemo: !items.length }
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] })
      const previous = queryClient.getQueriesData({ queryKey: ['orders'] })
      queryClient.setQueriesData({ queryKey: ['orders'] }, (old) => {
        if (!old?.data) return old
        return { ...old, data: old.data.map((o) => (o.id === id ? { ...o, status } : o)) }
      })
      return { previous }
    },
    onError: (err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error(err?.response?.data?.message ?? 'Could not update order status')
    },
    onSuccess: () => toast.success('Order status updated'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => ordersApi.cancelOrder(id),
    onSuccess: () => {
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not cancel order'),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      toast.success('Order created')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not create order'),
  })
}
