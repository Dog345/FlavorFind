import { useMemo, useState } from 'react'
import { Search, Plus, Minus, Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { useOpenSessions, useMenuForOrder, useCreateOrder } from './useOrders'
import { formatKES } from '../../lib/format'

const STEPS = { SESSION: 'session', MENU: 'menu' }

export default function NewOrderModal({ open, onClose }) {
  const [step, setStep] = useState(STEPS.SESSION)
  const [sessionId, setSessionId] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState([]) // { itemId, name, price, qty, notes }

  const sessions = useOpenSessions(open)
  const menu = useMenuForOrder(open && step === STEPS.MENU)
  const createOrder = useCreateOrder()

  const categories = menu.categories ?? []
  const currentCategory = activeCategory ?? categories[0]?.id

  const visibleItems = useMemo(() => {
    const category = categories.find((c) => c.id === currentCategory)
    const items = category?.items ?? []
    if (!search) return items
    return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  }, [categories, currentCategory, search])

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id)
      if (existing) {
        return prev.map((c) => (c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { itemId: item.id, name: item.name, price: item.base_price, qty: 1, notes: '' }]
    })
  }

  const updateQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.itemId === itemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    )
  }

  const handleClose = () => {
    setStep(STEPS.SESSION)
    setSessionId(null)
    setCart([])
    setSearch('')
    onClose()
  }

  const handleSubmit = () => {
    createOrder.mutate(
      {
        session_id: sessionId,
        items: cart.map((c) => ({ menu_item_id: c.itemId, quantity: c.qty, notes: c.notes || undefined })),
      },
      { onSuccess: handleClose }
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="New order" size="xl">
      {step === STEPS.SESSION && (
        <div>
          <p className="mb-4 text-sm text-ink-500">Select the open table session to order for.</p>
          {sessions.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No open table sessions right now.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sessions.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSessionId(s.id)
                    setStep(STEPS.MENU)
                  }}
                  className="rounded-xl border border-surface-border p-4 text-left hover:border-brand-400 hover:bg-brand-50/40"
                >
                  <p className="font-bold text-ink-900">{s.table_label}</p>
                  <p className="text-xs text-ink-400">{s.covers} covers</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === STEPS.MENU && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-surface-border pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    currentCategory === c.id ? 'bg-brand-500 text-white' : 'bg-surface text-ink-500'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  disabled={!item.is_available}
                  onClick={() => addToCart(item)}
                  className="flex w-full items-center justify-between rounded-xl border border-surface-border p-3 text-left disabled:opacity-40 hover:border-brand-400 hover:bg-brand-50/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                    {!item.is_available && <p className="text-xs text-danger-500">Unavailable</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ink-700">{formatKES(item.base_price)}</span>
                    <Plus className="h-4 w-4 text-brand-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-semibold text-ink-700">Cart</p>
            {cart.length === 0 ? (
              <p className="rounded-xl border border-dashed border-surface-border p-6 text-center text-sm text-ink-400">
                No items added yet
              </p>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div key={c.itemId} className="flex items-center justify-between gap-2 rounded-xl bg-surface p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{c.name}</p>
                      <p className="text-xs text-ink-400">{formatKES(c.price)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(c.itemId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-500"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{c.qty}</span>
                      <button
                        onClick={() => updateQty(c.itemId, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-500"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => updateQty(c.itemId, -c.qty)}
                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-danger-500 hover:bg-danger-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-3">
              <span className="font-semibold text-ink-700">Total</span>
              <span className="text-lg font-bold text-ink-900">{formatKES(total)}</span>
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={cart.length === 0}
              loading={createOrder.isPending}
              onClick={handleSubmit}
            >
              Submit order
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
