// Seed data shown ONLY when the live API cannot be reached (e.g. VITE_API_URL not
// yet wired to a running backend). Every screen fetches from the real API first;
// this exists purely so the UI is inspectable during frontend development.

export const demoStats = {
  revenue_today: 96351,
  orders_today: 214,
  active_sessions: 18,
  pending_orders: 12,
}

export const demoRevenueSeries = [
  { label: 'Mon', revenue: 62000 },
  { label: 'Tue', revenue: 74500 },
  { label: 'Wed', revenue: 58900 },
  { label: 'Thu', revenue: 81200 },
  { label: 'Fri', revenue: 103400 },
  { label: 'Sat', revenue: 128700 },
  { label: 'Sun', revenue: 96351 },
]

export const demoStatusFunnel = [
  { status: 'pending', count: 12 },
  { status: 'confirmed', count: 34 },
  { status: 'preparing', count: 28 },
  { status: 'ready', count: 19 },
  { status: 'served', count: 61 },
  { status: 'paid', count: 189 },
]

export const demoPaymentBreakdown = [
  { method: 'M-Pesa', value: 58, color: 'var(--color-brand-500)' },
  { method: 'Cash', value: 27, color: 'var(--color-warning-500)' },
  { method: 'External', value: 15, color: 'var(--color-info-500)' },
]

export const demoRecentOrders = [
  { id: '1', order_number: '#0512', table: 'T-04', status: 'preparing', total: 3450, created_at: new Date(Date.now() - 6 * 60000).toISOString() },
  { id: '2', order_number: '#0511', table: 'T-11', status: 'served', total: 1980, created_at: new Date(Date.now() - 14 * 60000).toISOString() },
  { id: '3', order_number: '#0510', table: 'T-02', status: 'paid', total: 5620, created_at: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: '4', order_number: '#0509', table: 'T-07', status: 'pending', total: 1200, created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: '5', order_number: '#0508', table: 'T-09', status: 'ready', total: 2870, created_at: new Date(Date.now() - 31 * 60000).toISOString() },
  { id: '6', order_number: '#0507', table: 'T-01', status: 'cancelled', total: 990, created_at: new Date(Date.now() - 40 * 60000).toISOString() },
  { id: '7', order_number: '#0506', table: 'T-14', status: 'paid', total: 4310, created_at: new Date(Date.now() - 52 * 60000).toISOString() },
]

const demoItems = (seed) => [
  {
    id: `${seed}-i1`,
    name: 'Nyama Choma Platter',
    quantity: 1,
    status: seed % 3 === 0 ? 'ready' : seed % 3 === 1 ? 'preparing' : 'pending',
    modifiers: ['Extra ugali'],
    notes: seed % 4 === 0 ? 'No chili' : '',
    unit_price: 1800,
  },
  {
    id: `${seed}-i2`,
    name: 'Passion Juice',
    quantity: 2,
    status: 'ready',
    modifiers: [],
    notes: '',
    unit_price: 250,
  },
]

export const demoWaiters = ['Amina W.', 'Brian K.', 'Faith N.', 'David O.']

export const demoOrdersList = Array.from({ length: 24 }).map((_, i) => {
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled']
  const status = statuses[i % statuses.length]
  return {
    id: `order-${i + 1}`,
    order_number: `#${String(520 - i).padStart(4, '0')}`,
    table: `T-${String((i % 16) + 1).padStart(2, '0')}`,
    waiter: demoWaiters[i % demoWaiters.length],
    items: demoItems(i),
    items_count: 2,
    total: 2050 + (i % 5) * 480,
    status,
    payment_status: status === 'paid' ? 'paid' : 'unpaid',
    created_at: new Date(Date.now() - (i + 1) * 9 * 60000).toISOString(),
  }
})

export const demoOpenSessions = Array.from({ length: 10 }).map((_, i) => ({
  id: `session-${i + 1}`,
  table_id: `table-${i + 1}`,
  table_label: `T-${String(i + 1).padStart(2, '0')}`,
  covers: 2 + (i % 4),
  opened_at: new Date(Date.now() - (i + 3) * 11 * 60000).toISOString(),
}))

export const demoFloors = [
  { id: 'floor-1', name: 'Ground Floor' },
  { id: 'floor-2', name: 'Rooftop' },
  { id: 'floor-3', name: 'Garden' },
]

export const demoTables = [
  ...Array.from({ length: 8 }).map((_, i) => ({
    id: `table-g-${i + 1}`,
    floor_id: 'floor-1',
    label: `T-${String(i + 1).padStart(2, '0')}`,
    capacity: [2, 4, 4, 6][i % 4],
    status: ['available', 'occupied', 'occupied', 'reserved', 'available'][i % 5],
    session: null,
  })),
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `table-r-${i + 1}`,
    floor_id: 'floor-2',
    label: `R-${String(i + 1).padStart(2, '0')}`,
    capacity: [2, 4][i % 2],
    status: ['available', 'occupied', 'unavailable'][i % 3],
    session: null,
  })),
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: `table-gd-${i + 1}`,
    floor_id: 'floor-3',
    label: `G-${String(i + 1).padStart(2, '0')}`,
    capacity: [4, 6][i % 2],
    status: ['available', 'reserved'][i % 2],
    session: null,
  })),
].map((t) =>
  t.status === 'occupied'
    ? { ...t, session: { covers: Math.min(t.capacity, 3), opened_at: new Date(Date.now() - 34 * 60000).toISOString() } }
    : t
)

export const demoMenuCategories = [
  {
    id: 'cat-1',
    name: 'Grills & Nyama Choma',
    items: [
      { id: 'item-1', name: 'Nyama Choma Platter (Full)', base_price: 1800, is_available: true },
      { id: 'item-2', name: 'Beef Skewers (4pc)', base_price: 950, is_available: true },
      { id: 'item-3', name: 'Grilled Tilapia', base_price: 1350, is_available: true },
    ],
  },
  {
    id: 'cat-2',
    name: 'Starters',
    items: [
      { id: 'item-4', name: 'Samosas (5pc)', base_price: 400, is_available: true },
      { id: 'item-5', name: 'Mixed Salad', base_price: 350, is_available: true },
    ],
  },
  {
    id: 'cat-3',
    name: 'Drinks',
    items: [
      { id: 'item-6', name: 'Passion Juice', base_price: 250, is_available: true },
      { id: 'item-7', name: 'Tusker Lager', base_price: 350, is_available: true },
      { id: 'item-8', name: 'Sparkling Water', base_price: 200, is_available: false },
    ],
  },
]
