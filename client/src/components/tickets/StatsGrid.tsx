import { Layers, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react'

interface StatsGridProps {
  total: number
  open: number
  highPriority: number
  done: number
}

export function StatsGrid({ total, open, highPriority, done }: StatsGridProps) {
  const inProgress = total - open - done
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0

  const stats = [
    { label: 'Total', value: total, Icon: Layers, color: '#818cf8' },
    { label: 'Open', value: open, Icon: BarChart3, color: '#fbbf24' },
    { label: 'High Priority', value: highPriority, Icon: AlertCircle, color: '#f43f5e' },
    { label: 'Done', value: done, Icon: CheckCircle2, color: '#34d399' },
  ]

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 px-4 py-4">
            <Icon size={14} strokeWidth={2} style={{ color }} />
            <p className="text-xl font-bold tracking-tight" style={{ color }}>{value}</p>
            <p className="text-center text-[10px] font-medium uppercase tracking-wider text-foreground/35">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress strip */}
      <div className="px-4 pb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-foreground/30">Completion</span>
          <span className="text-[11px] font-semibold" style={{ color: '#34d399' }}>{donePercent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          {/* open (amber) */}
          <div className="flex h-full">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${total > 0 ? (done / total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #34d399, #10b981)',
              }}
            />
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${total > 0 ? (inProgress / total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #818cf8, #38bdf8)',
              }}
            />
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-foreground/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Done
          </span>
          <span className="flex items-center gap-1 text-[10px] text-foreground/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
            In Progress
          </span>
          <span className="flex items-center gap-1 text-[10px] text-foreground/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/20" />
            Open
          </span>
        </div>
      </div>
    </div>
  )
}
