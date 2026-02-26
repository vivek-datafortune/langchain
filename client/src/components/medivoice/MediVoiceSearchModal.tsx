import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useMediVoiceSearchStore } from '../../lib/stores/medivoiceSearchStore'

const EASE = [0.32, 0.72, 0, 1] as const
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export interface MediVoiceSearchModalProps {
  /** When provided, submit closes the modal and runs the enquiry on the page (events + result in response panel). */
  onSubmitTextQuery?: (text: string) => Promise<void>
}

export function MediVoiceSearchModal({ onSubmitTextQuery }: MediVoiceSearchModalProps) {
  const open = useMediVoiceSearchStore((s) => s.open)
  const setOpen = useMediVoiceSearchStore((s) => s.setOpen)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (onSubmitTextQuery) {
      onSubmitTextQuery(q)
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4"
          style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="w-full max-w-2xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search size={20} className="text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything… (e.g. list patients, clinic summary)"
                  className="flex-1 min-w-0 bg-transparent text-sm text-white/90 placeholder:text-white/35 outline-none"
                />
              </div>
            </form>

            <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/30">
              <span>
                {isMac ? '⌘' : 'Ctrl'}K to open · Esc to close
              </span>
              <span>Enter — result will show in response panel</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
