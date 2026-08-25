import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as tablesApi from '../../api/tables'
import { unwrapCollection } from '../../api/client'
import { demoFloors, demoTables } from '../../lib/demoData'

export function useFloors() {
  const query = useQuery({ queryKey: ['floors'], queryFn: tablesApi.getFloors, retry: 1 })
  if (query.isError) return { floors: demoFloors, isDemo: true, isLoading: false }
  const { items } = unwrapCollection(query.data)
  return { floors: items.length ? items : demoFloors, isDemo: !items.length, isLoading: query.isLoading }
}

export function useTables(floorId) {
  const query = useQuery({
    queryKey: ['tables', floorId],
    queryFn: () => tablesApi.getTables({ floorId }),
    enabled: !!floorId,
    retry: 1,
    refetchInterval: 20_000,
  })
  if (query.isError) {
    return { tables: demoTables.filter((t) => t.floor_id === floorId), isDemo: true, isLoading: false }
  }
  const { items } = unwrapCollection(query.data)
  const fallback = demoTables.filter((t) => t.floor_id === floorId)
  return { tables: items.length ? items : fallback, isDemo: !items.length, isLoading: query.isLoading }
}

export function useOpenTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, covers }) => tablesApi.openTable(id, { covers }),
    onSuccess: () => {
      toast.success('Session opened')
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['open-sessions'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not open session'),
  })
}

export function useCloseTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => tablesApi.closeTable(id),
    onSuccess: () => {
      toast.success('Session closed')
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['open-sessions'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Could not close session'),
  })
}
