import { motion } from 'framer-motion'
import { MediVoiceCard } from '../MediVoiceCard'

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 }

export function LoadingView() {
  return (
    <MediVoiceCard
      maxWidth="400px"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING }}
      exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-center px-10 py-12">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
        >
          <motion.div
            className="h-12 w-12 rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-center text-sm font-light tracking-wide text-white/70"
          >
            Hi there, we're getting things ready for you…
          </motion.p>
        </motion.div>
      </div>
    </MediVoiceCard>
  )
}
