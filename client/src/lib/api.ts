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
  conversationId?: string
  conversationMessageCount?: number
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
          if (currentEvent === 'result') {
            console.log('[api/enquireAudio] result payload received:', payload)
            callbacks.onResult(payload as EnquiryResult)
          }
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
          if (currentEvent === 'result') {
            console.log('[api/enquireText] result payload received:', payload)
            callbacks.onResult(payload as EnquiryResult)
          }
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

// ── Conversations (MediVoice) ────────────────────────────────
/**
 * GET /assistant/conversations/current — returns the current conversation's message count.
 */
export async function getConversationCurrent(): Promise<{ messageCount: number }> {
  const token = getAuthToken()
  if (!token) {
    throw new ApiError('Not authenticated. Please log in.')
  }

  const res = await fetch(`${ASSISTANT_BASE}/assistant/conversations/current`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new ApiError(json.error || 'Failed to get conversation state', res.status)
  }

  return json
}

/**
 * DELETE /assistant/conversations/clear — clears conversation history for the authenticated user.
 */
export async function clearConversation(): Promise<{ success: boolean; deletedCount: number }> {
  const token = getAuthToken()
  if (!token) {
    throw new ApiError('Not authenticated. Please log in.')
  }

  const res = await fetch(`${ASSISTANT_BASE}/assistant/conversations/clear`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new ApiError(json.error || 'Failed to clear conversation', res.status)
  }

  return json
}
