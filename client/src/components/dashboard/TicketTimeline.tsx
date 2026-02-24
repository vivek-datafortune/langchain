import { Activity } from 'lucide-react'
import type { TicketItem } from '../../lib/types'

interface TicketTimelineProps {
  tickets: TicketItem[]
}

const glassCard = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
}

const priorityDot: Record<string, string> = {
  High: '#f43f5e',
  Low: '#818cf8',
}

const groupGradient: Record<string, string> = {
  Today: 'linear-gradient(180deg, #818cf8, #38bdf8)',
  Yesterday: 'linear-gradient(180deg, #a78bfa, #818cf8)',
  'This Week': 'linear-gradient(180deg, #fbbf24, #f97316)',
  Older: 'linear-gradient(180deg, #94a3b8, #64748b)',
}

function groupByDay(tickets: TicketItem[]): { label: string; items: TicketItem[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86_400_000
  const weekAgo = today - 7 * 86_400_000

  const groups: Record<string, TicketItem[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  }

  const sorted = [...tickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  for (const t of sorted) {
    const created = new Date(t.createdAt).getTime()
    if (created >= today) groups['Today'].push(t)
    else if (created >= yesterday) groups['Yesterday'].push(t)
    else if (created >= weekAgo) groups['This Week'].push(t)
    else groups['Older'].push(t)
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

export function TicketTimeline({ tickets }: TicketTimelineProps) {
  const groups = groupByDay(tickets)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl" style={glassCard}>
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/6 px-5 py-4">
        <Activity size={14} className="text-indigo-400" />
        <div>
          <p className="text-sm font-semibold">Timeline</p>
          <p className="text-[11px] text-foreground/35">Recent ticket activity</p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        {groups.length === 0 && (
          <p className="py-4 text-center text-sm text-foreground/30">No tickets yet</p>
        )}

        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="h-px w-full bg-white/6" />}

            {/* Group header */}
            <div className="flex items-center gap-2 pt-1 pb-3">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: groupGradient[group.label] ?? groupGradient['Older'] }}
              >
                {group.label}
              </span>
              <span className="text-[11px] text-foreground/30">{group.items.length} ticket{group.items.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Timeline items */}
            <div className="relative space-y-0 pl-4">
              {/* Vertical gradient line */}
              <div
                className="absolute left-0 top-0 w-px"
                style={{
                  height: '100%',
                  background: groupGradient[group.label] ?? groupGradient['Older'],
                  opacity: 0.3,
                }}
              />

              {group.items.slice(0, 5).map(ticket => (
                <div key={ticket.id} className="relative flex items-start gap-3 py-2">
                  {/* Dot on the line */}
                  <span
                    className="absolute -left-0.75 top-3 h-1.5 w-1.5 rounded-full"
                    style={{ background: priorityDot[ticket.priority] ?? '#94a3b8' }}
                  />
                  <p className="flex-1 truncate text-xs leading-relaxed">{ticket.title}</p>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{
                      background: ticket.priority === 'High'
                        ? 'rgba(244,63,94,0.15)'
                        : 'rgba(129,140,248,0.15)',
                      color: ticket.priority === 'High' ? '#f43f5e' : '#818cf8',
                    }}
                  >
                    {ticket.priority}
                  </span>
                </div>
              ))}

              {group.items.length > 5 && (
                <p className="py-1 text-[11px] text-foreground/30">+{group.items.length - 5} more</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
