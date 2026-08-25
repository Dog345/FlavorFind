import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import Skeleton from '../../components/ui/Skeleton'

const COLORS = {
  pending: 'var(--color-warning-500)',
  confirmed: 'var(--color-info-500)',
  preparing: 'var(--color-brand-500)',
  ready: 'var(--color-purple-500)',
  served: 'var(--color-teal-500)',
  paid: 'var(--color-success-500)',
}

export default function StatusFunnelChart({ data, loading }) {
  const chartData = (data ?? []).map((d) => ({ ...d, label: d.status[0].toUpperCase() + d.status.slice(1) }))

  return (
    <div className="card p-5 lg:p-6">
      <h3 className="mb-4 text-base font-bold text-ink-900">Order status, today</h3>
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-surface-border)" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{ fill: 'var(--color-ink-500)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-surface)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid var(--color-surface-border)', fontSize: 13 }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={18}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status] ?? 'var(--color-ink-300)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
