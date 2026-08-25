import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutPanelTop } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBoundary from '../../components/ErrorBoundary'
import DemoDataBanner from '../../components/ui/DemoDataBanner'
import Skeleton from '../../components/ui/Skeleton'
import { useFloors, useTables, useOpenTable, useCloseTable } from './useTables'
import TableCard from './TableCard'
import OpenSessionModal from './OpenSessionModal'

export default function TablesPage() {
  const navigate = useNavigate()
  const { floors, isLoading: floorsLoading, isDemo: floorsDemo } = useFloors()
  const [activeFloor, setActiveFloor] = useState(null)

  useEffect(() => {
    if (!activeFloor && floors.length) setActiveFloor(floors[0].id)
  }, [floors, activeFloor])

  const { tables, isLoading, isDemo } = useTables(activeFloor)
  const openTable = useOpenTable()
  const closeTable = useCloseTable()
  const [sessionTarget, setSessionTarget] = useState(null)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Tables</h1>
        <p className="mt-1 text-sm text-ink-400">Visual floor plan for every dining area.</p>
      </div>

      {(isDemo || floorsDemo) && <DemoDataBanner />}

      {floorsLoading ? (
        <Skeleton className="mb-6 h-10 w-64" />
      ) : (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFloor(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeFloor === f.id ? 'bg-brand-500 text-white' : 'bg-white text-ink-500 border border-surface-border'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <ErrorBoundary>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="card">
            <EmptyState icon={LayoutPanelTop} title="No tables on this floor" description="Add tables from Settings → Floors & Tables." />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onOpenSession={setSessionTarget}
                onViewOrders={(t) => navigate(`/orders?table=${t.label}`)}
                onCloseSession={(t) => closeTable.mutate(t.id)}
                onMarkArrived={(t) => navigate('/reservations')}
              />
            ))}
          </div>
        )}
      </ErrorBoundary>

      <OpenSessionModal
        table={sessionTarget}
        open={!!sessionTarget}
        onClose={() => setSessionTarget(null)}
        loading={openTable.isPending}
        onConfirm={(covers) =>
          openTable.mutate(
            { id: sessionTarget.id, covers },
            { onSuccess: () => setSessionTarget(null) }
          )
        }
      />
    </div>
  )
}
