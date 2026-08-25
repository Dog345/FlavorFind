import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Minus, Plus } from 'lucide-react'

export default function OpenSessionModal({ table, open, onClose, onConfirm, loading }) {
  const [covers, setCovers] = useState(2)

  if (!table) return null

  return (
    <Modal open={open} onClose={onClose} title={`Open session · ${table.label}`} size="sm">
      <p className="mb-4 text-sm text-ink-500">How many covers for this session?</p>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setCovers((c) => Math.max(1, c - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-ink-600"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-3xl font-bold text-ink-900">{covers}</span>
        <button
          onClick={() => setCovers((c) => Math.min(table.capacity, c + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-ink-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-ink-400">Table capacity: {table.capacity}</p>

      <Button className="mt-6 w-full" loading={loading} onClick={() => onConfirm(covers)}>
        Open session
      </Button>
    </Modal>
  )
}
