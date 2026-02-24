import type { ApiResponse, FeedbackResult, TicketItem, TicketStatus, TicketsApiResponse } from './types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// ── Error class ─────────────────────────────────────────────
export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Assistant ───────────────────────────────────────────────
export async function submitMessage(content: string): Promise<FeedbackResult> {
  const res = await fetch(`${API_BASE}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.trim() }),
  })
  const json: ApiResponse = await res.json()
  if (!res.ok || !json.success) {
    throw new ApiError(
      (json as unknown as { error: string }).error || 'Something went wrong',
      res.status
    )
  }
  return json.data
}

export async function* submitMessageStream(
  content: string
): AsyncGenerator<{ type: 'meta' | 'chunk' | 'ticket' | 'done'; data: string }> {
  const res = await fetch(`${API_BASE}/reply/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.trim() }),
  })

  if (!res.ok) {
    throw new ApiError('Stream request failed', res.status)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new ApiError('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') return
        try {
          const parsed = JSON.parse(raw)
          yield parsed
        } catch {
          yield { type: 'chunk' as const, data: raw }
        }
      }
    }
  }
}

// ── Tickets ─────────────────────────────────────────────────
export async function getTickets(params?: {
  status?: TicketStatus
  priority?: string
  page?: number
  limit?: number
}): Promise<{ tickets: TicketItem[]; total: number }> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.priority) query.set('priority', params.priority)
  if (params?.page) query.set('page', String(params.page))
  query.set('limit', String(params?.limit ?? 50))

  const res = await fetch(`${API_BASE}/tickets?${query}`)
  const json: TicketsApiResponse = await res.json()
  if (!res.ok || !json.success) {
    throw new ApiError('Failed to load tickets', res.status)
  }
  return {
    tickets: json.data.tickets,
    total: json.data.pagination.total,
  }
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    throw new ApiError('Failed to update ticket status', res.status)
  }
}

export function getApiBase(): string {
  return API_BASE
}
