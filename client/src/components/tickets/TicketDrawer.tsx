import { Modal, Button, Chip } from '@heroui/react'
import { Calendar, Clock, AlertTriangle, Hash, FileText, RefreshCw } from 'lucide-react'
import type { TicketItem, TicketStatus } from '../../lib/types'
import { PRIORITY_COLOR, STATUS_COLOR, timeAgo } from '../../lib/types'
import { TicketStatusSelect } from './TicketStatusSelect'

interface TicketDrawerProps {
  ticket: TicketItem | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (id: string, status: TicketStatus) => void
  isUpdating: boolean
}

const priorityGradient: Record<string, string> = {
  High: 'linear-gradient(135deg, #f43f5e, #ef4444)',
  Low: 'linear-gradient(135deg, #34d399, #10b981)',
}

export function TicketDrawer({ ticket, isOpen, onClose, onStatusChange, isUpdating }: TicketDrawerProps) {
  if (!ticket) return null

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <Modal isOpen={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <Modal.Backdrop className="backdrop-blur-sm">
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-lg overflow-hidden border-0">
            <Modal.CloseTrigger />

            {/* Gradient top bar */}
            <div
              className="h-1 w-full"
              style={{ background: priorityGradient[ticket.priority] ?? priorityGradient.Low }}
            />

            <Modal.Header className="pb-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-foreground/30" />
                  <span className="font-mono text-[11px] text-foreground/30">
                    {String(ticket.id).slice(-8)}
                  </span>
                </div>
                <Modal.Heading className="text-base font-bold leading-snug">
                  {ticket.title}
                </Modal.Heading>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="soft" color={PRIORITY_COLOR[ticket.priority]}>
                    <span className="flex items-center gap-1">
                      {ticket.priority === 'High' && <AlertTriangle size={10} />}
                      {ticket.priority} Priority
                    </span>
                  </Chip>
                  <Chip size="sm" variant="soft" color={STATUS_COLOR[ticket.status]}>
                    {ticket.status}
                  </Chip>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="space-y-5 pt-2">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-foreground/30" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                    Description
                  </p>
                </div>
                <div
                  className="rounded-xl p-3.5 text-sm leading-relaxed"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {ticket.description}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Created', icon: Calendar, value: ticket.createdAt },
                  { label: 'Updated', icon: Clock, value: ticket.updatedAt },
                ].map(({ label, icon: Icon, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={11} className="text-foreground/30" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                        {label}
                      </p>
                    </div>
                    <p className="mt-1.5 text-xs font-medium">{formatDate(value)}</p>
                    <p className="text-[11px] text-foreground/30">{timeAgo(value)}</p>
                  </div>
                ))}
              </div>

              {/* Status changer */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RefreshCw size={13} className="text-foreground/30" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                    Update Status
                  </p>
                </div>
                <TicketStatusSelect
                  status={ticket.status}
                  onChange={status => onStatusChange(ticket.id, status)}
                  isDisabled={isUpdating}
                />
              </div>
            </Modal.Body>

            <Modal.Footer className="pt-2">
              <Button variant="secondary" slot="close" size="sm">
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
