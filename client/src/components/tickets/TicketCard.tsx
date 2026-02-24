import { Chip } from '@heroui/react'
import { AlertTriangle, Clock, CheckCircle2, Circle, Loader, Flame, Feather } from 'lucide-react'
import type { TicketItem, TicketStatus } from '../../lib/types'
import { STATUS_COLOR, timeAgo } from '../../lib/types'
import { TicketStatusSelect } from './TicketStatusSelect'

interface TicketCardProps {
  ticket: TicketItem
  isNew: boolean
  isUpdating: boolean
  onStatusChange: (id: string, status: TicketStatus) => void
  onPress: (ticket: TicketItem) => void
}

const priorityStyle = {
  High: {
    gradient: 'from-rose-500/15 to-red-500/5',
    border: 'border-rose-500/25 hover:border-rose-400/60',
    iconColor: 'text-rose-400',
    Icon: Flame,
    label: 'High Priority',
  },
  Low: {
    gradient: 'from-indigo-500/15 to-violet-500/5',
    border: 'border-indigo-500/25 hover:border-indigo-400/60',
    iconColor: 'text-indigo-400',
    Icon: Feather,
    label: 'Low Priority',
  },
} as const

const statusIcon: Record<TicketStatus, typeof Circle> = {
  Open: Circle,
  'In Progress': Loader,
  Done: CheckCircle2,
}

export function TicketCard({ ticket, isNew, isUpdating, onStatusChange, onPress }: TicketCardProps) {
  const pStyle = priorityStyle[ticket.priority] ?? priorityStyle.Low
  const { gradient, border, iconColor, Icon, label } = pStyle
  const StatusIcon = statusIcon[ticket.status]

  return (
    <button
      type="button"
      onClick={() => onPress(ticket)}
      className={[
        'group flex w-full flex-col gap-2.5 rounded-2xl border bg-gradient-to-br p-4 text-left transition-all duration-200',
        'hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]',
        gradient, border,
        isNew ? 'ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-background' : '',
      ].join(' ')}
    >
      {/* Top row: priority icon + label + NEW badge + ID */}
      <div className="flex items-center gap-2">
        <Icon size={14} strokeWidth={2} className={iconColor} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${iconColor}`}>
          {label}
        </span>
        {isNew && (
          <span
            className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white animate-pulse"
            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
          >
            New
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] text-foreground/25">
          #{String(ticket.id).slice(-8)}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-snug group-hover:text-foreground">
        {ticket.title}
      </p>

      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-foreground/50 group-hover:text-foreground/70">
        {ticket.description}
      </p>

      {/* Bottom row: status chip + time + status select */}
      <div
        className="flex items-center gap-2 pt-1"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Chip size="sm" variant="soft" color={STATUS_COLOR[ticket.status]}>
          <span className="flex items-center gap-1">
            <StatusIcon size={10} />
            {ticket.status}
          </span>
        </Chip>
        <span className="text-[11px] text-foreground/30">
          {timeAgo(ticket.createdAt)}
        </span>
        <div className="ml-auto">
          <TicketStatusSelect
            status={ticket.status}
            onChange={status => onStatusChange(ticket.id, status)}
            isDisabled={isUpdating}
          />
        </div>
      </div>
    </button>
  )
}
