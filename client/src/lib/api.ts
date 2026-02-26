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

// ── MediVoice (Whisper STT) ──────────────────────────────────
// Same host as API: Node serves both /api and /assistant (default port 5001)
const ASSISTANT_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5001'

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  const res = await fetch(`${ASSISTANT_BASE}/assistant/transcribe`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new ApiError('Transcription failed', res.status)
  return res.json()
}

export interface EnquiryStage {
  stage: number
  message: string
  data?: Record<string, unknown>
}

export interface EnquiryResult {
  reply: string
  intent: string
  transcription: string
  response_type?: 'text' | 'json'
  data?: Record<string, unknown>
}

function getAuthToken(): string | null {
  const match = document.cookie.match(/(?:^|; )medivoice_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * POST /assistant/enquiry — SSE endpoint.
 * Streams stage events, then a final result event, then closes.
 * Calls onStage for progress updates, onResult for the final reply, onError on failure.
 */
export async function enquireAudio(
  audioBlob: Blob,
  callbacks: {
    onStage: (s: EnquiryStage) => void
    onResult: (r: EnquiryResult) => void
    onError: (msg: string) => void
  },
): Promise<void> {
  const token = getAuthToken()
  if (!token) {
    callbacks.onError('Not authenticated. Please log in.')
    return
  }

  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')

  let res: Response
  try {
    res = await fetch(`${ASSISTANT_BASE}/assistant/enquiry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
  } catch {
    callbacks.onError('Network error — could not reach the server.')
    return
  }

  if (!res.ok || !res.body) {
    callbacks.onError(`Request failed (${res.status})`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ') && currentEvent) {
        try {
          const payload = JSON.parse(line.slice(6))
          if (currentEvent === 'stage')  callbacks.onStage(payload as EnquiryStage)
          if (currentEvent === 'result') callbacks.onResult(payload as EnquiryResult)
          if (currentEvent === 'error')  callbacks.onError((payload as { error: string }).error ?? 'Unknown error')
        } catch {
          // malformed JSON — ignore
        }
        currentEvent = ''
      } else if (line === '') {
        currentEvent = ''
      }
    }
  }
}

/**
 * POST /assistant/enquiry/text — text-based enquiry (SSE, same event format as enquireAudio).
 */
export async function enquireText(
  text: string,
  callbacks: {
    onStage: (s: EnquiryStage) => void
    onResult: (r: EnquiryResult) => void
    onError: (msg: string) => void
  },
): Promise<void> {
  const token = getAuthToken()
  if (!token) {
    callbacks.onError('Not authenticated. Please log in.')
    return
  }

  let res: Response
  try {
    res = await fetch(`${ASSISTANT_BASE}/assistant/enquiry/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: text.trim() }),
    })
  } catch {
    callbacks.onError('Network error — could not reach the server.')
    return
  }

  if (!res.ok || !res.body) {
    callbacks.onError(`Request failed (${res.status})`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ') && currentEvent) {
        try {
          const payload = JSON.parse(line.slice(6))
          if (currentEvent === 'stage') callbacks.onStage(payload as EnquiryStage)
          if (currentEvent === 'result') callbacks.onResult(payload as EnquiryResult)
          if (currentEvent === 'error') callbacks.onError((payload as { error: string }).error ?? 'Unknown error')
        } catch {
          /* ignore */
        }
        currentEvent = ''
      } else if (line === '') {
        currentEvent = ''
      }
    }
  }
}

// ── Auth (MediVoice) ─────────────────────────────────────────
export interface MediVoiceUser {
  id: string
  phone: string
  name: string
  gender: string
  dob: string
  user_type: string
}

export async function loginWithPhone(phone: string) {
  const { default: axiosClient } = await import('./axios')
  const { data } = await axiosClient.post('/auth/login', { phone })
  return data as { success: boolean; data: { user: MediVoiceUser; token: string }; timestamp: string }
}

export async function getMe(): Promise<MediVoiceUser> {
  const { default: axiosClient } = await import('./axios')
  const { data } = await axiosClient.get<{ success: boolean; data: { user: MediVoiceUser }; timestamp: string }>('/auth/me')
  return data.data.user
}

export function getApiBase(): string {
  return API_BASE
}
