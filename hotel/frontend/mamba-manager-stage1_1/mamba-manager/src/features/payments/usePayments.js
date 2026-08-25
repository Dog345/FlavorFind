import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as paymentsApi from '../../api/payments'

export function usePayCash(orderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => paymentsApi.payCash(orderId, payload),
    onSuccess: () => {
      toast.success('Cash payment recorded')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not record payment'),
  })
}

export function usePayExternal(orderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => paymentsApi.payExternal(orderId, payload),
    onSuccess: () => {
      toast.success('Payment recorded')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not record payment'),
  })
}

export function usePayMpesa(orderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => paymentsApi.payMpesa(orderId, payload),
    onSuccess: () => {
      toast.success('M-Pesa prompt sent to customer')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not initiate M-Pesa payment'),
  })
}

export function usePaymentStatusPoll(paymentId, enabled) {
  return useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: () => paymentsApi.getPaymentStatus(paymentId),
    enabled: enabled && !!paymentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'completed' || status === 'failed' || status === 'timeout' ? false : 3000
    },
  })
}
