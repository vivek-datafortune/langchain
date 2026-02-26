import { Routes, Route, Navigate, useOutletContext } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { AlexaApp } from '../pages/AlexaApp'
import { MediVoiceApp } from '../pages/MediVoiceApp'
import { AssistantTab } from '../components/assistant/AssistantTab'
import { TicketsTab } from '../components/tickets/TicketsTab'
import { DashboardTab } from '../components/dashboard/DashboardTab'
import { MediVoicePage } from '../components/medivoice/MediVoicePage'

export interface AlexaOutletContext {
  onViewTickets: () => void
  onNewTicket: (ticketId: string) => void
  newTicketId: string | null
  onGoToAssistant: () => void
}

function AssistantRoute() {
  const ctx = useOutletContext<AlexaOutletContext>()
  return <AssistantTab onViewTickets={ctx.onViewTickets} onNewTicket={ctx.onNewTicket} />
}

function TicketsRoute() {
  const ctx = useOutletContext<AlexaOutletContext>()
  return <TicketsTab newTicketId={ctx.newTicketId} onGoToAssistant={ctx.onGoToAssistant} />
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Alexa Feedback AI — own shell & nav */}
      <Route element={<AlexaApp />}>
        <Route path="/assistant" element={<AssistantRoute />} />
        <Route path="/tickets" element={<TicketsRoute />} />
        <Route path="/dashboard" element={<DashboardTab />} />
      </Route>

      {/* MediVoice — own shell & nav */}
      <Route element={<MediVoiceApp />}>
        <Route path="/medivoice" element={<MediVoicePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
