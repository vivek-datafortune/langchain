// ── Mood & Status types ─────────────────────────────────────
export type Mood = 'Angry' | 'Neutral' | 'Feedback' | 'Enquiry'
export type TicketStatus = 'Open' | 'In Progress' | 'Done'
export type TicketPriority = 'Low' | 'High'

// ── Data interfaces ─────────────────────────────────────────
export interface TicketItem {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
}

export interface ReplyTicket {
  id: string
  title: string
  status: string
  priority?: string
}

export interface FeedbackResult {
  mood: Mood
  confidence: number
  reasoning: string
  reply: string
  ticket?: ReplyTicket
}

// ── API response wrappers ───────────────────────────────────
export interface ApiResponse {
  success: boolean
  message: string
  data: FeedbackResult
  timestamp: string
}

export interface TicketsApiResponse {
  success: boolean
  data: {
    tickets: TicketItem[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

// ── UI helpers ──────────────────────────────────────────────
export const MOOD_EMOJI: Record<Mood, string> = {
  Angry: '😡',
  Neutral: '😐',
  Feedback: '💬',
  Enquiry: '🔍',
}

export const MOOD_COLOR: Record<Mood, 'danger' | 'default' | 'accent' | 'warning'> = {
  Angry: 'danger',
  Neutral: 'default',
  Feedback: 'accent',
  Enquiry: 'warning',
}

export const STATUS_COLOR: Record<TicketStatus, 'warning' | 'accent' | 'success'> = {
  Open: 'warning',
  'In Progress': 'accent',
  Done: 'success',
}

export const PRIORITY_COLOR: Record<TicketPriority, 'danger' | 'success'> = {
  High: 'danger',
  Low: 'success',
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
