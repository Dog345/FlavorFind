import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as authApi from '../api/auth'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const storeLogout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const token = useAuthStore((s) => s.token)

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      storeLogin({ token: data.token, user: data.user, tenant: data.tenant })
      navigate('/')
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? 'Invalid email or password'
      toast.error(message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      storeLogout()
      navigate('/login')
    },
  })

  return {
    user,
    tenant,
    token,
    isAuthenticated: !!token,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  }
}
