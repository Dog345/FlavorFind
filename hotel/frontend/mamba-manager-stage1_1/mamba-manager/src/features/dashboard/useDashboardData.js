import { useQuery } from '@tanstack/react-query'
import * as dashboardApi from '../../api/dashboard'
import {
  demoStats,
  demoRevenueSeries,
  demoStatusFunnel,
  demoPaymentBreakdown,
  demoRecentOrders,
} from '../../lib/demoData'

// Every hook here tries the real API first (per the spec's endpoints). If the
// backend isn't reachable yet, `isDemo` flips true and the screen falls back
// to representative seed data instead of a blank/broken dashboard.

export function useTenantStats() {
  const query = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getTenantStats,
    retry: 1,
    staleTime: 30_000,
  })
  return {
    data: query.data ?? (query.isError ? demoStats : undefined),
    isLoading: query.isLoading,
    isDemo: query.isError,
  }
}

export function useRevenueSeries() {
  const dateFrom = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const query = useQuery({
    queryKey: ['dashboard-revenue', dateFrom],
    queryFn: () => dashboardApi.getRevenueSeries({ granularity: 'day', dateFrom }),
    retry: 1,
    staleTime: 60_000,
  })
  const series = query.data?.data ?? query.data
  return {
    data: Array.isArray(series) && series.length ? series : query.isError ? demoRevenueSeries : undefined,
    isLoading: query.isLoading,
    isDemo: query.isError,
  }
}

export function useStatusFunnel() {
  const query = useQuery({
    queryKey: ['dashboard-status-funnel'],
    queryFn: () => dashboardApi.getStatusFunnel({ dateFrom: 'today' }),
    retry: 1,
    staleTime: 30_000,
  })
  const funnel = query.data?.data ?? query.data
  return {
    data: Array.isArray(funnel) && funnel.length ? funnel : query.isError ? demoStatusFunnel : undefined,
    isLoading: query.isLoading,
    isDemo: query.isError,
  }
}

export function usePaymentBreakdown() {
  const query = useQuery({
    queryKey: ['dashboard-payment-breakdown'],
    queryFn: dashboardApi.getPaymentBreakdown,
    retry: 1,
    staleTime: 60_000,
  })
  const breakdown = query.data?.data ?? query.data
  return {
    data: Array.isArray(breakdown) && breakdown.length ? breakdown : query.isError ? demoPaymentBreakdown : undefined,
    isLoading: query.isLoading,
    isDemo: query.isError,
  }
}

export function useRecentOrders() {
  const query = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: () => dashboardApi.getRecentOrders({ limit: 10 }),
    retry: 1,
    staleTime: 15_000,
  })
  const orders = query.data?.data ?? query.data
  return {
    data: Array.isArray(orders) && orders.length ? orders : query.isError ? demoRecentOrders : undefined,
    isLoading: query.isLoading,
    isDemo: query.isError,
  }
}
