import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/common/useTheme'

// ─────────────────────────────────────────────────────────────
// Theme Toggle — matches MediVoiceContextRing / MediVoiceActionMenu
// Glassmorphic circular button with spring animations
// ─────────────────────────────────────────────────────────────

const SPRING_SOFT = { type: 'spring' as const, stiffness: 200, damping: 20 }

export function MediVoiceThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 shadow-2xl backdrop-blur-xl"
      style={{ background: 'rgba(255,255,255,0.1)' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1, transition: SPRING_SOFT }}
            exit={{ rotate: 90, opacity: 0, transition: { duration: 0.15 } }}
          >
            <Sun size={22} strokeWidth={2} className="text-amber-300/90" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1, transition: SPRING_SOFT }}
            exit={{ rotate: -90, opacity: 0, transition: { duration: 0.15 } }}
          >
            <Moon size={22} strokeWidth={2} className="text-sky-400/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
