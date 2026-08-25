import { useEffect } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import { useTenantStore } from '../stores/tenantStore'

// Central place every screen's real-time behaviour is defined. Feature pages
// react to cache invalidation rather than each opening their own socket.
export function useWebSocket() {
  const token = useAuthStore((s) => s.token)
  const tenant = useAuthStore((s) => s.tenant)
  const setEcho = useTenantStore((s) => s.setEcho)
  const setWsStatus = useTenantStore((s) => s.setWsStatus)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !tenant?.id) return
    if (!import.meta.env.VITE_REVERB_APP_KEY) return

    setWsStatus('connecting')
    window.Pusher = Pusher

    const echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT,
      wssPort: import.meta.env.VITE_REVERB_PORT,
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Slug': tenant.slug,
        },
      },
    })

    const channel = echo
      .private(`tenant.${tenant.id}`)
      .listen('OrderPlaced', () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
        toast.success('New order placed')
      })
      .listen('OrderStatusUpdated', () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
      })
      .listen('OrderItemStatusUpdated', () => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
      })
      .listen('ReservationUpdated', () => {
        queryClient.invalidateQueries({ queryKey: ['reservations'] })
      })
      .listen('PaymentReceived', () => {
        queryClient.invalidateQueries({ queryKey: ['payments'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        toast.success('Payment received')
      })

    setEcho(echo)
    setWsStatus('connected')

    echo.connector?.pusher?.connection?.bind('error', () => setWsStatus('error'))
    echo.connector?.pusher?.connection?.bind('disconnected', () => setWsStatus('disconnected'))

    return () => {
      channel.stopListening('OrderPlaced')
      echo.leave(`tenant.${tenant.id}`)
      echo.disconnect()
      setEcho(null)
      setWsStatus('disconnected')
    }
  }, [token, tenant?.id, tenant?.slug, queryClient, setEcho, setWsStatus])
}
