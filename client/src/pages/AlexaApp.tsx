import { useState, useCallback } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { toast } from '@heroui/react'
import { AlexaShell } from '../layouts/AlexaShell'

type TabKey = 'assistant' | 'tickets' | 'dashboard'

export function AlexaApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const [ticketCount, setTicketCount] = useState(0)
  const [newTicketId, setNewTicketId] = useState<string | null>(null)

  const getActiveTab = (): TabKey => {
    if (location.pathname.startsWith('/tickets')) return 'tickets'
    if (location.pathname.startsWith('/dashboard')) return 'dashboard'
    return 'assistant'
  }

  const handleNewTicket = useCallback((ticketId: string) => {
    setNewTicketId(ticketId)
    setTicketCount(prev => prev + 1)
    toast.success('New ticket created', {
      description: `Ticket #${ticketId.slice(-8)} has been generated`,
    })
  }, [])

  const handleViewTickets = useCallback(() => navigate('/tickets'), [navigate])
  const handleGoToAssistant = useCallback(() => navigate('/assistant'), [navigate])

  return (
    <AlexaShell activeTab={getActiveTab()} ticketCount={ticketCount}>
      <Outlet context={{ onNewTicket: handleNewTicket, onViewTickets: handleViewTickets, newTicketId, onGoToAssistant: handleGoToAssistant }} />
    </AlexaShell>
  )
}
