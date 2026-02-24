import { PieChart } from 'lucide-react'
import type { TicketItem } from '../../lib/types'

interface MoodChartProps {
  tickets: TicketItem[]
}

const glassCard = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
}

export function MoodChart({ tickets }: MoodChartProps) {
  const total = tickets.length || 1

  const priorityData = [
    {
      label: 'High',
      count: tickets.filter(t => t.priority === 'High').length,
      gradient: 'linear-gradient(90deg, #f43f5e, #ef4444)',
      dot: '#f43f5e',
    },
    {
      label: 'Low',
      count: tickets.filter(t => t.priority === 'Low').length,
      gradient: 'linear-gradient(90deg, #6366f1, #818cf8)',
      dot: '#818cf8',
    },
  ]

  const statusData = [
    {
      label: 'Open',
      count: tickets.filter(t => t.status === 'Open').length,
      gradient: 'linear-gradient(90deg, #fbbf24, #f97316)',
      dot: '#fbbf24',
    },
    {
      label: 'In Progress',
      count: tickets.filter(t => t.status === 'In Progress').length,
      gradient: 'linear-gradient(90deg, #818cf8, #38bdf8)',
      dot: '#818cf8',
    },
    {
      label: 'Done',
      count: tickets.filter(t => t.status === 'Done').length,
      gradient: 'linear-gradient(90deg, #34d399, #10b981)',
      dot: '#34d399',
    },
  ]

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl" style={glassCard}>
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
        <PieChart size={14} className="text-indigo-400" />
        <div>
          <p className="text-sm font-semibold">Distribution</p>
          <p className="text-[11px] text-foreground/35">Priority &amp; status breakdown</p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        {/* Priority */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
            By Priority
          </p>
          {priorityData.map(d => (
            <div key={d.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: d.dot }} />
                  {d.label}
                </span>
                <span className="text-xs font-semibold tabular-nums">{d.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(d.count / total) * 100}%`, background: d.gradient }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/[0.06]" />

        {/* Status */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
            By Status
          </p>
          {statusData.map(d => (
            <div key={d.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: d.dot }} />
                  {d.label}
                </span>
                <span className="text-xs font-semibold tabular-nums">{d.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(d.count / total) * 100}%`, background: d.gradient }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
