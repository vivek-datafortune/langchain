import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { MediVoiceCard } from './MediVoiceCard'

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 }

export function PermissionDeniedView() {
  return (
    <MediVoiceCard
      maxWidth="420px"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING }}
      exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }}
    >
      <div className="flex flex-col items-center gap-6 px-8 py-12 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: 1,
            rotate: 0,
            transition: { ...SPRING, delay: 0.1 },
          }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/20"
          style={{ background: 'rgba(251,191,36,0.08)' }}
        >
          <Mic size={28} className="text-amber-400/80" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="flex flex-col gap-2"
        >
          <p className="text-base font-medium text-white/90">Microphone access needed</p>
          <p className="text-sm text-white/50">
            Allow the mic in your browser, then reload to continue.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => window.location.reload()}
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white/95"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          Reload page
        </motion.button>
      </div>
    </MediVoiceCard>
  )
}
