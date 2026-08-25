import { apiClient } from './client'

export async function getPayments({ method, status, dateFrom, dateTo, page = 1 } = {}) {
  const { data } = await apiClient.get('/api/v1/payments', {
    params: { method, status, date_from: dateFrom, date_to: dateTo, page },
  })
  return data
}

export async function payCash(orderId, { amountTendered, notes }) {
  const { data } = await apiClient.post(`/api/v1/orders/${orderId}/payments/cash`, {
    amount_tendered: amountTendered,
    notes,
  })
  return data
}

export async function payExternal(orderId, { amount, provider, reference, notes }) {
  const { data } = await apiClient.post(`/api/v1/orders/${orderId}/payments/external`, {
    amount,
    provider,
    reference,
    notes,
  })
  return data
}

export async function payMpesa(orderId, { phone }) {
  const { data } = await apiClient.post(`/api/v1/orders/${orderId}/payments/mpesa`, { phone })
  return data
}

export async function getPaymentStatus(paymentId) {
  const { data } = await apiClient.get(`/api/v1/payments/${paymentId}/status`)
  return data
}

export async function getReconciliation() {
  const { data } = await apiClient.get('/api/v1/payments/reconciliation')
  return data
}
