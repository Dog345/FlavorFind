import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Skeleton from '../../components/ui/Skeleton'
import { formatKES, formatCompactNumber } from '../../lib/format'

export default function RevenueChart({ data, loading }) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink-900">Revenue, last 7 days</h3>
      </div>
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="var(--color-surface-border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-ink-400)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactNumber}
              tick={{ fill: 'var(--color-ink-400)', fontSize: 12 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-brand-50)' }}
              formatter={(value) => [formatKES(value), 'Revenue']}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--color-surface-border)',
                fontSize: 13,
              }}
            />
            <Bar dataKey="revenue" fill="var(--color-brand-500)" radius={[8, 8, 8, 8]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
