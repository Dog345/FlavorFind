import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const { token, tenant } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (tenant?.slug) {
    config.headers['X-Tenant-Slug'] = tenant.slug
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

// Normalizes both paginated ({ data, links, meta }) and plain ({ data }) collection responses
export function unwrapCollection(payload) {
  return {
    items: payload?.data ?? [],
    meta: payload?.meta ?? null,
    links: payload?.links ?? null,
  }
}
