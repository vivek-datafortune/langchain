import { useState, useCallback, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Types ─────────────────────────────────────────────────────────────────────
type Mood         = 'Angry' | 'Neutral' | 'Feedback' | 'Enquiry'
type TicketStatus = 'Open' | 'In Progress' | 'Done'
type TicketPriority = 'Low' | 'High'

interface TicketItem {
  id: string; title: string; description: string
  status: TicketStatus; priority: TicketPriority
  createdAt: string; updatedAt: string
}
interface ReplyTicket {
  id: string; title: string; status: string; priority?: string
}
interface FeedbackResult {
  mood: Mood; confidence: number; reasoning: string; reply: string; ticket?: ReplyTicket
}
interface ApiResponse {
  success: boolean; message: string; data: FeedbackResult; timestamp: string
}
interface TicketsApiResponse {
  success: boolean
  data: { tickets: TicketItem[]; pagination: { total: number; page: number; limit: number; pages: number } }
}

// ── Config ────────────────────────────────────────────────────────────────────
const API = 'http://localhost:5001/api'

type MoodCfg = { label: string; emoji: string; text: string; border: string; bg: string; strip: string; shadow: string }
const MOOD: Record<Mood, MoodCfg> = {
  Angry:    { label: 'Angry',    emoji: '😡', text: 'text-red-400',    border: 'border-red-500/45',    bg: 'bg-red-500/14',    strip: 'from-red-500 to-orange-400',    shadow: 'shadow-red-500/20'    },
  Neutral:  { label: 'Neutral',  emoji: '😐', text: 'text-slate-300',  border: 'border-slate-500/45',  bg: 'bg-slate-500/14',  strip: 'from-slate-400 to-slate-300',   shadow: 'shadow-slate-500/20'  },
  Feedback: { label: 'Feedback', emoji: '💬', text: 'text-sky-300',    border: 'border-sky-500/45',    bg: 'bg-sky-500/14',    strip: 'from-blue-500 to-cyan-400',     shadow: 'shadow-sky-500/20'    },
  Enquiry:  { label: 'Enquiry',  emoji: '🔍', text: 'text-violet-300', border: 'border-violet-500/45', bg: 'bg-violet-500/14', strip: 'from-violet-500 to-indigo-400', shadow: 'shadow-violet-500/20' },
}
const PRIORITY_STYLE: Record<TicketPriority, string> = {
  High: 'text-red-300 bg-red-500/18 border-red-500/40',
  Low:  'text-emerald-300 bg-emerald-500/18 border-emerald-500/40',
}
const STATUS_STYLE: Record<TicketStatus, string> = {
  'Open':        'text-amber-300 bg-amber-500/18 border-amber-500/40',
  'In Progress': 'text-sky-300 bg-sky-500/18 border-sky-500/40',
  'Done':        'text-emerald-300 bg-emerald-500/18 border-emerald-500/40',
}
const PRIORITY_BORDER: Record<TicketPriority, string> = {
  High: 'border-l-red-500/80',
  Low:  'border-l-emerald-500/80',
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ConfidenceArc({ value }: { value: number }) {
  const r = 24, cx = 30, cy = 30
  const circ   = 2 * Math.PI * r
  const arcLen = circ * 0.75
  const dash   = arcLen * value
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 60, height: 60 }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <defs>
          <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="oklch(0.64 0.22 290)" />
            <stop offset="100%" stopColor="oklch(0.70 0.15 200)" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.08"
          strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} transform={`rotate(135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#ag)"
          strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`} transform={`rotate(135 ${cx} ${cy})`}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none pointer-events-none">
        <span className="text-sm font-bold tabular-nums">{Math.round(value * 100)}</span>
        <span className="text-[9px] text-muted-foreground mt-px">%</span>
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="text-xs text-muted-foreground mr-0.5 font-medium">Thinking</span>
      <span className="size-1.5 rounded-full bg-primary/60 dot-1" />
      <span className="size-1.5 rounded-full bg-primary/60 dot-2" />
      <span className="size-1.5 rounded-full bg-primary/60 dot-3" />
    </div>
  )
}

const Icon = {
  send: <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M.989 8 .064 2.68a1.342 1.342 0 0 1 1.85-1.462l13.402 5.744a1.13 1.13 0 0 1 0 2.076L1.913 14.782a1.343 1.343 0 0 1-1.85-1.463L.99 8Zm.603-5.288L2.38 7.25h4.87a.75.75 0 0 1 0 1.5H2.38l-.788 4.538L13.929 8Z"/></svg>,
  refresh: <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.001 7.001 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.501 5.501 0 0 0 8 2.5zM1.705 8.005a.75.75 0 0 1 .834.656 5.501 5.501 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.001 7.001 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834z"/></svg>,
  info: <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-.25 3.25a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3z"/></svg>,
  ticket: <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v2.5C0 6.216.784 7 1.75 7h.5V8.5h-.5C.784 8.5 0 9.284 0 10.25v2.5C0 13.716.784 14.5 1.75 14.5h12.5A1.75 1.75 0 0 0 16 12.75v-2.5C16 9.284 15.216 8.5 14.25 8.5h-.5V7h.5C15.216 7 16 6.216 16 5.25v-2.5A1.75 1.75 0 0 0 14.25 1H1.75z"/></svg>,
  alert: <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8.22 1.754a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368L8.22 1.754zm-1.28-1.666C7.21-.272 8.79-.272 9.06.088L15.142 11.466A1.75 1.75 0 0 1 13.607 14H2.393A1.75 1.75 0 0 1 .858 11.466L6.94.088zM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-5.25a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5z"/></svg>,
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]                   = useState<'assistant' | 'tickets'>('assistant')
  const [content, setContent]           = useState('')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<FeedbackResult | null>(null)
  const [replyError, setReplyError]     = useState<string | null>(null)
  const [newTicketId, setNewTicketId]   = useState<string | null>(null)
  const [tickets, setTickets]           = useState<TicketItem[]>([])
  const [total, setTotal]               = useState(0)
  const [ticketsLoading, setTLoading]   = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [updatingId, setUpdatingId]     = useState<string | null>(null)
  const textareaRef                     = useRef<HTMLTextAreaElement>(null)

  const fetchTickets = useCallback(async () => {
    setTLoading(true); setTicketsError(null)
    try {
      const res  = await fetch(`${API}/tickets?limit=50`)
      const json: TicketsApiResponse = await res.json()
      if (!res.ok || !json.success) throw new Error('Failed to load tickets')
      setTickets(json.data.tickets)
      setTotal(json.data.pagination.total)
    } catch (err) {
      setTicketsError(err instanceof Error ? err.message : 'Could not load tickets')
    } finally { setTLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'tickets') fetchTickets() }, [tab, fetchTickets])

  const handleSubmit = async () => {
    if (!content.trim() || loading) return
    setLoading(true); setResult(null); setReplyError(null); setNewTicketId(null)
    try {
      const res  = await fetch(`${API}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      const json: ApiResponse = await res.json()
      if (!res.ok || !json.success)
        throw new Error((json as unknown as { error: string }).error || 'Something went wrong')
      setResult(json.data)
      if (json.data.ticket) setNewTicketId(json.data.ticket.id)
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to connect to server')
    } finally { setLoading(false) }
  }

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    setUpdatingId(id)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    try {
      const res = await fetch(`${API}/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('failed')
    } catch { fetchTickets() }
    finally  { setUpdatingId(null) }
  }

  const openCount = tickets.filter(t => t.status === 'Open').length
  const highCount = tickets.filter(t => t.priority === 'High').length
  const doneCount = tickets.filter(t => t.status === 'Done').length
  const moodCfg   = result ? MOOD[result.mood] : null

  return (
    <div className="min-h-screen bg-background bg-dot-grid text-foreground flex flex-col">

      {/* ═══ HEADER ═══ */}
      <header className="glass sticky top-0 z-20 h-13 px-5 flex items-center gap-4">
        <div className="size-7 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/50">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5L12 11H1L6.5 1.5Z" fill="white" fillOpacity="0.92"/>
          </svg>
        </div>
        <div className="flex-1 flex items-baseline gap-2">
          <span className="font-semibold text-sm text-foreground/90">Alexa</span>
          <span className="text-sm font-semibold text-ai-gradient">Feedback AI</span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground border border-border/70 rounded-full px-2 py-px ml-1">
            AI-powered · intent detection
          </span>
        </div>
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-white/6 border border-white/10">
          {(['assistant', 'tickets'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn-nav relative px-3.5 py-1 rounded-lg text-xs font-medium capitalize ${tab === t ? 'active' : ''}`}
            >
              {t}
              {t === 'tickets' && total > 0 && (
                <span className="ml-1.5 text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-px font-semibold">
                  {total}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">

        {/* ── ASSISTANT TAB ── */}
        {tab === 'assistant' && (
          <>
            {/* Response */}
            {(loading || result || replyError) && (
              <div className="animate-fade-in-up space-y-3">

                {loading && (
                  <div className="rounded-2xl border border-primary/40 bg-card/80 px-5 py-4 animate-border-flow">
                    <div className="flex items-center gap-3">
                      <div className="size-7 rounded-full bg-linear-to-br from-violet-500/25 to-indigo-500/25 border border-violet-500/40 flex items-center justify-center shrink-0">
                        <span className="size-2.5 rounded-full bg-primary/75 animate-pulse" />
                      </div>
                      <ThinkingDots />
                    </div>
                  </div>
                )}

                {replyError && !loading && (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/8 px-5 py-4 flex items-center gap-3 text-sm text-red-400">
                    {Icon.alert} <span>{replyError}</span>
                  </div>
                )}

                {result && moodCfg && !loading && (
                  <div className={`rounded-2xl border ${moodCfg.border} bg-card overflow-hidden shadow-xl ${moodCfg.shadow}`}>
                    <div className={`h-px bg-linear-to-r ${moodCfg.strip}`} />
                    <div className="p-5 space-y-4">

                      {/* Mood + confidence */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-xl ${moodCfg.bg} border ${moodCfg.border} flex items-center justify-center text-xl`}>
                            {moodCfg.emoji}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${moodCfg.text}`}>{moodCfg.label}</p>
                            <p className="text-[11px] text-muted-foreground">Intent detected</p>
                          </div>
                        </div>
                        <ConfidenceArc value={result.confidence} />
                      </div>

                      <div className="h-px bg-border/50" />

                      {/* Reply */}
                      <div className={`rounded-xl ${moodCfg.bg} border ${moodCfg.border} px-4 py-3.5`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="size-4 rounded-full bg-linear-to-br from-violet-500/60 to-indigo-500/60 border border-violet-500/50" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI Response</span>
                        </div>
                        <p className="text-sm leading-relaxed">{result.reply}</p>
                      </div>

                      {/* Reasoning */}
                      <div className="flex items-start gap-2.5 px-1">
                        <span className="mt-px text-muted-foreground/50">{Icon.info}</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{result.reasoning}</p>
                      </div>

                      {/* Ticket */}
                      {result.ticket && (
                        <>
                          <div className="h-px bg-border/50" />
                          <div className="rounded-xl border border-white/12 bg-white/4 px-4 py-3.5 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground/60">{Icon.ticket}</span>
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ticket Created</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium leading-snug">{result.ticket.title}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {result.ticket.priority && (
                                  <span className={`inline-flex items-center text-[11px] font-medium px-2 py-px rounded-full border ${PRIORITY_STYLE[result.ticket.priority as TicketPriority] ?? ''}`}>
                                    {result.ticket.priority}
                                  </span>
                                )}
                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-px rounded-full border ${STATUS_STYLE[result.ticket.status as TicketStatus] ?? ''}`}>
                                  {result.ticket.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-muted-foreground/45">
                                #{String(result.ticket.id).slice(-8)}
                              </span>
                              <button onClick={() => setTab('tickets')}
                                className="text-xs text-primary/70 hover:text-primary transition-colors duration-150">
                                View all tickets →
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input card */}
            <div className={`rounded-2xl border bg-card overflow-hidden transition-all duration-300 ${loading ? 'animate-border-flow' : 'border-border/70 hover:border-border/90'}`}>
              <div className="px-4 pt-4 pb-2">
                <textarea
                  ref={textareaRef}
                  className="textarea-ai w-full min-h-28 bg-transparent border-0 p-0 resize-none text-sm placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-40 leading-relaxed"
                  placeholder="Send feedback, ask a question, or report an issue…"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
                  disabled={loading}
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
                  <span className="tabular-nums">{content.length} chars</span>
                  <span className="hidden sm:inline opacity-70">⌘↵ to send</span>
                </div>
                <button onClick={handleSubmit} disabled={loading || !content.trim()}
                  className="btn-ai inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold">
                  {loading
                    ? <span className="size-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin-sm" />
                    : Icon.send}
                  {loading ? 'Analysing…' : 'Send'}
                </button>
              </div>
            </div>

            {/* Mood hint */}
            {!result && !loading && !replyError && (
              <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground/40 select-none">
                {['😡 Angry', '😐 Neutral', '💬 Feedback', '🔍 Enquiry'].map(m => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TICKETS TAB ── */}
        {tab === 'tickets' && (
          <div className="space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Support Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-generated by the AI pipeline</p>
              </div>
              <button onClick={fetchTickets} disabled={ticketsLoading}
                className="btn-nav inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs disabled:opacity-40">
                <span className={ticketsLoading ? 'animate-spin-sm' : ''}>{Icon.refresh}</span>
                Refresh
              </button>
            </div>

            {/* Stats */}
            {tickets.length > 0 && (
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { label: 'Total',         val: total,      color: 'text-foreground',    bg: 'bg-white/6 border-white/12'              },
                  { label: 'Open',          val: openCount,  color: 'text-amber-300',     bg: 'bg-amber-500/12 border-amber-500/30'     },
                  { label: 'High Priority', val: highCount,  color: 'text-red-300',       bg: 'bg-red-500/12 border-red-500/30'         },
                  { label: 'Done',          val: doneCount,  color: 'text-emerald-300',   bg: 'bg-emerald-500/12 border-emerald-500/30' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl border px-3 py-2.5 text-center`}>
                    <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {ticketsError && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/8 px-4 py-3 flex items-center gap-2.5 text-sm text-red-400">
                {Icon.alert} {ticketsError}
              </div>
            )}

            {ticketsLoading && tickets.length === 0 && (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/30 bg-card p-4 space-y-2.5">
                    <div className="skeleton h-3.5 rounded-full w-3/5" />
                    <div className="skeleton h-2.5 rounded-full w-2/5" />
                  </div>
                ))}
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length === 0 && (
              <div className="text-center py-20 space-y-3">
                <div className="mx-auto size-14 rounded-2xl bg-white/6 border border-white/12 flex items-center justify-center text-2xl">🎫</div>
                <p className="font-medium text-sm">No tickets yet</p>
                <p className="text-xs text-muted-foreground">Send a frustrated message or feedback in the Assistant.</p>
                <button onClick={() => setTab('assistant')}
                  className="mt-1 text-xs text-primary/70 hover:text-primary transition-colors">
                  Go to Assistant →
                </button>
              </div>
            )}

            <div className="space-y-2">
              {tickets.map((ticket, i) => (
                <div key={ticket.id}
                  className={`
                    rounded-2xl border-l-[3px] border border-border/55
                    bg-card hover:bg-card/80 hover:border-border/80
                    transition-all duration-200 overflow-hidden
                    ${PRIORITY_BORDER[ticket.priority]}
                    ${newTicketId === ticket.id ? 'ring-1 ring-primary/50 shadow-lg shadow-primary/14' : ''}
                  `}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="px-4 py-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {newTicketId === ticket.id && (
                                <span className="text-[9px] font-bold text-primary bg-primary/12 border border-primary/20 px-1.5 py-px rounded-full tracking-widest uppercase">New</span>
                              )}
                              <span className="text-[10px] font-mono text-muted-foreground/45">#{String(ticket.id).slice(-8)}</span>
                            </div>
                            <p className="text-sm font-medium leading-snug">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">{ticket.description}</p>
                          </div>
                          <Select value={ticket.status}
                            onValueChange={v => handleStatusChange(ticket.id, v as TicketStatus)}
                            disabled={updatingId === ticket.id}>
                            <SelectTrigger className="h-7 w-32 text-[11px] shrink-0 border-border/35 bg-white/3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`${PRIORITY_STYLE[ticket.priority]} border text-[10px] h-5 px-1.5`}>{ticket.priority}</Badge>
                          <Badge className={`${STATUS_STYLE[ticket.status]} border text-[10px] h-5 px-1.5`}>{ticket.status}</Badge>
                          <span className="text-[10px] text-muted-foreground/45 ml-auto">
                            {timeAgo(ticket.createdAt)}
                            {ticket.updatedAt !== ticket.createdAt && ` · updated ${timeAgo(ticket.updatedAt)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/40 py-3 flex items-center justify-center gap-2">
        <span className="size-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/60" />
        <span className="text-[11px] text-muted-foreground/65">Connected · {API}</span>
      </footer>
    </div>
  )
}

