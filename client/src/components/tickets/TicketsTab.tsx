import { useState, useEffect } from 'react'
import { Alert, Skeleton, Spinner, ScrollShadow } from '@heroui/react'
import { RefreshCw, Ticket, Sparkles, ArrowRight } from 'lucide-react'
import { useTickets } from '../../lib/hooks/useTickets'
import { StatsGrid } from './StatsGrid'
import { TicketCard } from './TicketCard'
import { TicketDrawer } from './TicketDrawer'
import type { TicketItem, TicketStatus } from '../../lib/types'
import { toast } from '@heroui/react'

interface TicketsTabProps {
  newTicketId: string | null
  onGoToAssistant: () => void
}

export function TicketsTab({ newTicketId, onGoToAssistant }: TicketsTabProps) {
  const {
    tickets,
    total,
    loading,
    error,
    updatingId,
    fetchTickets,
    updateStatus,
    stats,
  } = useTickets(true)

  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      await updateStatus(id, status)
      toast.success(`Ticket updated to "${status}"`)
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null)
      }
    } catch {
      toast.danger('Failed to update ticket status')
    }
  }

  const openDrawer = (ticket: TicketItem) => {
    setSelectedTicket(ticket)
    setDrawerOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-6 pb-4">
        
        <div />
        <button
          onClick={() => fetchTickets()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-foreground/50 transition-all hover:text-foreground/80 disabled:opacity-40"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats — fixed above scroll, not part of the list */}
      {tickets.length > 0 && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-3">
          <StatsGrid
            total={total}
            open={stats.openCount}
            highPriority={stats.highCount}
            done={stats.doneCount}
          />
        </div>
      )}

      {/* Scrollable ticket list */}
      <ScrollShadow className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-6">

          {/* Error state */}
          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Error loading tickets</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {/* Loading skeletons */}
          {loading && tickets.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-24 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && tickets.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: 'rgba(129,140,248,0.08)',
                  border: '1px solid rgba(129,140,248,0.15)',
                }}
              >
                <Sparkles size={24} className="text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">No tickets yet</p>
                <p className="text-sm text-foreground/40">
                  Send a frustrated message or feedback in the Assistant to auto-generate tickets.
                </p>
              </div>
              <button
                onClick={onGoToAssistant}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  boxShadow: '0 0 16px rgba(99,102,241,0.35)',
                }}
              >
                Go to Assistant
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Ticket list */}
          {tickets.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {loading && <Spinner size="sm" className="self-center" />}
              {tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isNew={newTicketId === ticket.id}
                  isUpdating={updatingId === ticket.id}
                  onStatusChange={handleStatusChange}
                  onPress={openDrawer}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollShadow>

      {/* Drawer */}
      <TicketDrawer
        ticket={selectedTicket}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        isUpdating={updatingId === selectedTicket?.id}
      />
    </div>
  )
}
