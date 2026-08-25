import { apiClient } from './client'

export async function getTenantStats() {
  const { data } = await apiClient.get('/api/v1/tenant/stats')
  return data
}

export async function getRevenueSeries({ granularity = 'day', dateFrom } = {}) {
  const { data } = await apiClient.get('/api/v1/analytics/revenue', {
    params: { granularity, date_from: dateFrom },
  })
  return data
}

export async function getStatusFunnel({ dateFrom = 'today' } = {}) {
  const { data } = await apiClient.get('/api/v1/analytics/status-funnel', {
    params: { date_from: dateFrom },
  })
  return data
}

export async function getPaymentBreakdown() {
  const { data } = await apiClient.get('/api/v1/analytics/payment-breakdown')
  return data
}

export async function getRecentOrders({ limit = 10 } = {}) {
  const { data } = await apiClient.get('/api/v1/orders', { params: { limit } })
  return data
}
