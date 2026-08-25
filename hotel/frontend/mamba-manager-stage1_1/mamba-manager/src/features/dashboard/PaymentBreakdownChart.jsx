import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Skeleton from '../../components/ui/Skeleton'

export default function PaymentBreakdownChart({ data, loading }) {
  return (
    <div className="card p-5 lg:p-6">
      <h3 className="mb-4 text-base font-bold text-ink-900">Payment methods</h3>
      {loading ? (
        <Skeleton className="h-52 w-full" />
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="55%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="method"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                stroke="none"
              >
                {(data ?? []).map((entry) => (
                  <Cell key={entry.method} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{ borderRadius: 12, border: '1px solid var(--color-surface-border)', fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2.5">
            {(data ?? []).map((entry) => (
              <div key={entry.method} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-ink-500">{entry.method}</span>
                <span className="ml-auto text-sm font-semibold text-ink-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
