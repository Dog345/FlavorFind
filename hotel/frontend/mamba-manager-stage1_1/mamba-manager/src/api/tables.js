import { apiClient } from './client'

export async function getFloors() {
  const { data } = await apiClient.get('/api/v1/floors')
  return data
}

export async function getTables({ floorId } = {}) {
  const { data } = await apiClient.get('/api/v1/tables', { params: { floor_id: floorId } })
  return data
}

export async function openTable(id, { covers }) {
  const { data } = await apiClient.post(`/api/v1/tables/${id}/open`, { covers })
  return data
}

export async function closeTable(id) {
  const { data } = await apiClient.post(`/api/v1/tables/${id}/close`)
  return data
}

export async function createFloor(payload) {
  const { data } = await apiClient.post('/api/v1/floors', payload)
  return data
}

export async function updateFloor(id, payload) {
  const { data } = await apiClient.put(`/api/v1/floors/${id}`, payload)
  return data
}

export async function deleteFloor(id) {
  const { data } = await apiClient.delete(`/api/v1/floors/${id}`)
  return data
}

export async function createTable(payload) {
  const { data } = await apiClient.post('/api/v1/tables', payload)
  return data
}

export async function updateTable(id, payload) {
  const { data } = await apiClient.put(`/api/v1/tables/${id}`, payload)
  return data
}

export async function deleteTable(id) {
  const { data } = await apiClient.delete(`/api/v1/tables/${id}`)
  return data
}
