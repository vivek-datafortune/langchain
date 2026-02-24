import { useState, useCallback } from 'react'
import { Toast, toast } from '@heroui/react'
import { AppShell } from './components/layout/AppShell'
import { AssistantTab } from './components/assistant/AssistantTab'
import { TicketsTab } from './components/tickets/TicketsTab'
import { DashboardTab } from './components/dashboard/DashboardTab'

type TabKey = 'assistant' | 'tickets' | 'dashboard'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('assistant')
  const [ticketCount, setTicketCount] = useState(0)
  const [newTicketId, setNewTicketId] = useState<string | null>(null)

  const handleNewTicket = useCallback((ticketId: string) => {
    setNewTicketId(ticketId)
    setTicketCount(prev => prev + 1)
    toast.success('New ticket created', {
      description: `Ticket #${ticketId.slice(-8)} has been generated`,
    })
  }, [])

  const handleViewTickets = useCallback(() => {
    setActiveTab('tickets')
  }, [])

  const handleGoToAssistant = useCallback(() => {
    setActiveTab('assistant')
  }, [])

  return (
    <>
      <Toast.Provider placement="top end" />
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ticketCount={ticketCount}
      >
        {activeTab === 'assistant' && (
          <AssistantTab
            onViewTickets={handleViewTickets}
            onNewTicket={handleNewTicket}
          />
        )}
        {activeTab === 'tickets' && (
          <TicketsTab
            newTicketId={newTicketId}
            onGoToAssistant={handleGoToAssistant}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab />
        )}
      </AppShell>
    </>
  )
}
