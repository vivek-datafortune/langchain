import { Select, ListBox, Label } from '@heroui/react'
import { Circle, Loader, CheckCircle2 } from 'lucide-react'
import type { TicketStatus } from '../../lib/types'

interface TicketStatusSelectProps {
  status: TicketStatus
  onChange: (status: TicketStatus) => void
  isDisabled?: boolean
}

const statuses: TicketStatus[] = ['Open', 'In Progress', 'Done']

const statusIcon: Record<TicketStatus, typeof Circle> = {
  Open: Circle,
  'In Progress': Loader,
  Done: CheckCircle2,
}

const statusColor: Record<TicketStatus, string> = {
  Open: '#fbbf24',
  'In Progress': '#818cf8',
  Done: '#34d399',
}

export function TicketStatusSelect({ status, onChange, isDisabled }: TicketStatusSelectProps) {
  return (
    <Select
      className="w-36"
      selectedKey={status}
      onSelectionChange={key => onChange(key as TicketStatus)}
      isDisabled={isDisabled}
      aria-label="Change ticket status"
    >
      <Label className="sr-only">Status</Label>
      <Select.Trigger
        className="rounded-xl text-xs"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {statuses.map(s => {
            const Icon = statusIcon[s]
            return (
              <ListBox.Item key={s} id={s} textValue={s}>
                <span className="flex items-center gap-2">
                  <Icon size={12} style={{ color: statusColor[s] }} />
                  {s}
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}
