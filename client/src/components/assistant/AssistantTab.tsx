import { useEffect, useRef } from 'react'
import { ScrollShadow, Chip, Button } from '@heroui/react'
import { Sparkles, Trash2, WifiOff, SlidersHorizontal, Flame, GitBranchPlus } from 'lucide-react'
import { useAssistant } from '../../lib/hooks/useAssistant'
import { useHistoryStore } from '../../lib/stores/historyStore'
import { MessageInput } from './MessageInput'
import { ResultCard } from './ResultCard'
import type { Mood } from '../../lib/types'
import { MOOD_COLOR } from '../../lib/types'
import { MOOD_ICON } from '../../lib/moodIcons'
import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'

interface ExamplePrompt {
  text: string
  label: string
  Icon: ComponentType<LucideProps>
  gradient: string
  iconColor: string
  border: string
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    text: 'My Echo Dot disconnects from Wi-Fi every few hours.',
    label: 'Bug Report',
    Icon: WifiOff,
    gradient: 'from-orange-500/15 to-red-500/5',
    iconColor: 'text-orange-400',
    border: 'border-orange-500/25 hover:border-orange-400/60',
  },
  {
    text: 'What is the speaker configuration of Echo Studio?',
    label: 'Enquiry',
    Icon: SlidersHorizontal,
    gradient: 'from-sky-500/15 to-cyan-500/5',
    iconColor: 'text-sky-400',
    border: 'border-sky-500/25 hover:border-sky-400/60',
  },
  {
    text: 'I was charged twice for Amazon Music — I demand a refund!',
    label: 'Complaint',
    Icon: Flame,
    gradient: 'from-rose-500/15 to-pink-500/5',
    iconColor: 'text-rose-400',
    border: 'border-rose-500/25 hover:border-rose-400/60',
  },
  {
    text: 'Can Alexa routines use if/then conditional logic?',
    label: 'How-to',
    Icon: GitBranchPlus,
    gradient: 'from-violet-500/15 to-purple-500/5',
    iconColor: 'text-violet-400',
    border: 'border-violet-500/25 hover:border-violet-400/60',
  },
]

interface AssistantTabProps {
  onViewTickets: () => void
  onNewTicket: (ticketId: string) => void
}

export function AssistantTab({ onViewTickets, onNewTicket }: AssistantTabProps) {
  const { content, setContent, loading, error, isStreaming, submit } = useAssistant()
  const { entries, clear } = useHistoryStore()

  // Notify parent once per unique ticket
  const notifiedTicketId = useRef<string | null>(null)
  const latestTicketId = entries.length > 0 ? entries[entries.length - 1]?.result?.ticket?.id : undefined
  useEffect(() => {
    if (latestTicketId && latestTicketId !== notifiedTicketId.current) {
      notifiedTicketId.current = latestTicketId
      onNewTicket(latestTicketId)
    }
  }, [latestTicketId, onNewTicket])

  // Scroll to latest (bottom)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* ── Scrollable chat area ──────────────────────────────── */}
      <ScrollShadow className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">

          {entries.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/30 to-accent/60 text-white shadow-inner">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Alexa Feedback AI</h2>
                <p className="mt-1 text-sm text-muted">Send feedback, ask product questions, or report an issue.</p>
              </div>

              {/* Mood badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(Object.keys(MOOD_ICON) as Mood[]).map(mood => {
                  const Icon = MOOD_ICON[mood]
                  return (
                    <Chip key={mood} size="sm" variant="soft" color={MOOD_COLOR[mood]} className="flex items-center gap-1 text-xs">
                      <Icon size={11} strokeWidth={2} />
                      {mood}
                    </Chip>
                  )
                })}
              </div>

              {/* Example prompts */}
              <div className="grid w-full gap-3 sm:grid-cols-2">
                {EXAMPLE_PROMPTS.map(({ text, label, Icon, gradient, iconColor, border }) => (
                  <button
                    key={text}
                    onClick={() => setContent(text)}
                    className={[
                      'group flex flex-col gap-2.5 rounded-2xl border bg-gradient-to-br p-4 text-left transition-all duration-200',
                      'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
                      gradient, border,
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} strokeWidth={2} className={iconColor} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${iconColor}`}>{label}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/70 group-hover:text-foreground">
                      {text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Chat messages ── */
            <>
              {entries.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-3">
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2.5 text-sm leading-relaxed">
                      {entry.userMessage}
                    </div>
                  </div>

                  {/* AI bubble */}
                  <ResultCard
                    result={entry.result}
                    isStreaming={isStreaming}
                    onViewTickets={onViewTickets}
                  />

                  {/* Timestamp */}
                  <span className="text-right text-xs text-muted">
                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing indicator while loading */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/80 to-accent text-white">
                    <Sparkles size={14} strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>
      </ScrollShadow>

      {/* ── Sticky bottom input ──────────────────────────────────── */}
      <div className="bg-background/90 px-4 pb-5 pt-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {/* Error */}
          {error && !loading && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
          )}

          <MessageInput
            content={content}
            onContentChange={setContent}
            onSubmit={submit}
            loading={loading}
          />

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">Enter to send · Shift+Enter for new line</p>
            {entries.length > 0 && (
              <Button variant="ghost" size="sm" className="flex h-5 items-center gap-1 px-1 text-xs text-muted" onPress={clear}>
                <Trash2 size={11} /> Clear chat
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

