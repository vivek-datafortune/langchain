import { Chip, Button } from '@heroui/react'
import { Sparkles, Ticket, ArrowRight } from 'lucide-react'
import type { FeedbackResult } from '../../lib/types'
import { MOOD_COLOR, PRIORITY_COLOR } from '../../lib/types'
import { MOOD_ICON } from '../../lib/moodIcons'
import { StreamingText } from './StreamingText'

interface ResultCardProps {
  result: FeedbackResult
  isStreaming: boolean
  onViewTickets: () => void
}

export function ResultCard({ result, isStreaming, onViewTickets }: ResultCardProps) {
  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/80 to-accent text-white shadow-sm">
        <Sparkles size={14} strokeWidth={2} />
      </div>

      {/* Bubble content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Mood + confidence row */}
        <div className="flex flex-wrap items-center gap-2">
          {(() => { const Icon = MOOD_ICON[result.mood]; return <Icon size={15} strokeWidth={2} className="text-muted shrink-0" /> })()}
          <Chip color={MOOD_COLOR[result.mood]} variant="soft" size="sm">
            {result.mood}
          </Chip>
          <span className="text-xs text-muted">
            {Math.round(result.confidence * 100)}% confidence
          </span>
        </div>

        {/* Reply text */}
        <p className="text-sm leading-relaxed text-foreground">
          <StreamingText text={result.reply} isStreaming={isStreaming} />
        </p>

        {/* Reasoning */}
        {result.reasoning && (
          <p className="text-xs italic text-muted">{result.reasoning}</p>
        )}

        {/* Ticket callout */}
        {result.ticket && (
          <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-divider bg-surface-raised px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Ticket size={12} className="text-muted" />
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">Ticket created</span>
              <span className="font-mono text-xs text-muted">#{String(result.ticket.id).slice(-8)}</span>
            </div>
            <p className="text-sm font-medium leading-snug">{result.ticket.title}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {result.ticket.priority && (
                <Chip
                  color={PRIORITY_COLOR[result.ticket.priority as keyof typeof PRIORITY_COLOR]}
                  size="sm" variant="soft"
                >
                  {result.ticket.priority} priority
                </Chip>
              )}
              <Chip size="sm" variant="soft">{result.ticket.status}</Chip>
              <Button variant="ghost" size="sm" className="flex h-5 items-center gap-1 px-1 text-xs" onPress={onViewTickets}>
                View tickets <ArrowRight size={10} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
