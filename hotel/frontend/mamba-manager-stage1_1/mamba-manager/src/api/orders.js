import { apiClient } from './client'

export async function getOrders({ status, dateFrom, dateTo, tableId, page = 1, limit = 20 } = {}) {
  const { data } = await apiClient.get('/api/v1/orders', {
    params: {
      status: status && status !== 'all' ? status : undefined,
      date_from: dateFrom,
      date_to: dateTo,
      table_id: tableId,
      page,
      limit,
    },
  })
  return data
}

export async function getOrder(id) {
  const { data } = await apiClient.get(`/api/v1/orders/${id}`)
  return data
}

export async function createOrder(payload) {
  const { data } = await apiClient.post('/api/v1/orders', payload)
  return data
}

export async function updateOrderStatus(id, status) {
  const { data } = await apiClient.patch(`/api/v1/orders/${id}/status`, { status })
  return data
}

export async function cancelOrder(id) {
  const { data } = await apiClient.post(`/api/v1/orders/${id}/cancel`)
  return data
}

export async function updateOrderItemStatus(orderId, itemId, status) {
  const { data } = await apiClient.patch(`/api/v1/orders/${orderId}/items/${itemId}/status`, { status })
  return data
}

export async function getKitchenOrders() {
  const { data } = await apiClient.get('/api/v1/orders/kitchen')
  return data
}

export async function getOpenSessions() {
  const { data } = await apiClient.get('/api/v1/tables', { params: { has_open_session: true } })
  return data
}

export async function getMenuForOrder() {
  const { data } = await apiClient.get('/api/v1/menu/categories', { params: { with_items: true } })
  return data
}
