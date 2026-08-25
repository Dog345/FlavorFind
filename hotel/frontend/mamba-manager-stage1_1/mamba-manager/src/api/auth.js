import { apiClient } from './client'

export async function login({ email, password }) {
  const { data } = await apiClient.post('/api/v1/auth/login', { email, password })
  return data
}

export async function logout() {
  const { data } = await apiClient.post('/api/v1/auth/logout')
  return data
}
