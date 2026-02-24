import { useRef, useEffect } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'

interface MessageInputProps {
  content: string
  onContentChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
}

export function MessageInput({ content, onContentChange, onSubmit, loading }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [content])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && content.trim()) onSubmit()
    }
  }

  const canSend = !loading && content.trim().length > 0

  return (
    /* Gradient border shell — 1px padding reveals the gradient as a border */
    <div className="rounded-2xl p-px shadow-lg" style={{ background: 'linear-gradient(135deg, #f472b6, #818cf8, #38bdf8, #34d399)' }}>
      <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
        <textarea
          ref={textareaRef}
          rows={2}
          aria-label="Message input"
          className="max-h-[200px] min-h-[48px] flex-1 resize-none bg-transparent pt-1 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted"
          placeholder="Send feedback, ask a question, or report an issue…"
          value={content}
          onChange={e => onContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <button
          onClick={onSubmit}
          disabled={!canSend}
          aria-label="Send message"
          className={[
            'flex h-10 w-10 shrink-0 self-end items-center justify-center rounded-xl transition-all mb-0.5',
            canSend
              ? 'shadow-md hover:opacity-90 active:scale-95'
              : 'bg-surface-raised text-muted cursor-not-allowed',
          ].join(' ')}
          style={canSend ? { background: 'linear-gradient(135deg, #818cf8, #38bdf8)', color: 'white' } : undefined}
        >
          {loading
            ? <Loader2 size={16} className="animate-spin" />
            : <ArrowUp size={16} strokeWidth={2.5} />
          }
        </button>
      </div>
    </div>
  )
}
