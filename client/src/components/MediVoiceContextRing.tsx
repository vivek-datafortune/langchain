import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Context Ring — circular progress indicator for conversation context
// Shows how much of the 20-message context window is used.
// Click to clear context. Tablet-optimized, glassmorphic.
// ─────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }
const SPRING_SOFT = { type: 'spring' as const, stiffness: 220, damping: 22 }

const CONTEXT_LIMIT = 20
const RING_RADIUS = 27
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ≈ 169.6

function getRingColor(pct: number): string {
  if (pct === 0) return 'rgba(255,255,255,0.12)'
  if (pct < 0.45) return '#34d399' // emerald-400
  if (pct < 0.72) return '#22d3ee' // cyan-400
  if (pct < 0.9)  return '#fbbf24' // amber-400
  return '#f87171'                  // red-400
}

function getRingGlow(pct: number): string {
  if (pct < 0.72) return 'none'
  if (pct < 0.9) return '0 0 14px rgba(251,191,36,0.35), 0 0 4px rgba(251,191,36,0.2)'
  return '0 0 18px rgba(248,113,113,0.45), 0 0 6px rgba(248,113,113,0.25)'
}

interface MediVoiceContextRingProps {
  messageCount: number
  onClear: () => void
  isClearing?: boolean
}

export function MediVoiceContextRing({
  messageCount,
  onClear,
  isClearing = false,
}: MediVoiceContextRingProps) {
  const [isHovered, setIsHovered] = useState(false)

  const pct = Math.min(messageCount / CONTEXT_LIMIT, 1)
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct)
  const ringColor = getRingColor(pct)
  const isEmpty = messageCount === 0
  const isNearLimit = pct >= 0.72
  const isCritical = pct >= 0.9

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, transition: { ...SPRING, delay: 0.45 } }}
      className="relative flex items-center justify-center"
    >
      {/* ── Ring Button ─────────────────────────────────────── */}
      <motion.button
        type="button"
        onClick={onClear}
        disabled={isClearing || isEmpty}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={!isEmpty && !isClearing ? { scale: 1.1 } : undefined}
        whileTap={!isEmpty && !isClearing ? { scale: 0.92 } : undefined}
        className={`relative flex items-center justify-center ${
          isEmpty || isClearing ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{ width: 68, height: 68 }}
        aria-label={isEmpty ? 'No context' : `Clear context (${Math.round(pct * 100)}% full)`}
      >
        {/* SVG progress ring */}
        <svg
          width="68"
          height="68"
          viewBox="0 0 68 68"
          className="absolute inset-0 overflow-visible"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track ring */}
          <circle
            cx="34"
            cy="34"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="3"
          />
          {/* Progress arc */}
          <motion.circle
            cx="34"
            cy="34"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            animate={{
              strokeDashoffset,
              stroke: ringColor,
            }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            style={{ filter: isNearLimit ? `drop-shadow(0 0 3px ${ringColor})` : 'none' }}
          />
        </svg>

        {/* Critical pulse ring */}
        <AnimatePresence>
          {isCritical && !isEmpty && (
            <motion.div
              key="pulse"
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 20px rgba(248,113,113,0.4)' }}
            />
          )}
        </AnimatePresence>

        {/* Outer glow — near limit only */}
        <AnimatePresence>
          {isNearLimit && !isEmpty && (
            <motion.div
              key="glow"
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ boxShadow: getRingGlow(pct) }}
            />
          )}
        </AnimatePresence>

        {/* Centre glassmorphic disc */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center rounded-full border border-white/10 backdrop-blur-xl select-none"
          style={{
            width: 50,
            height: 50,
            background: isEmpty
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.07)',
          }}
          animate={
            isNearLimit && !isEmpty
              ? {
                  borderColor: [`rgba(255,255,255,0.10)`, `${ringColor}30`, `rgba(255,255,255,0.10)`],
                }
              : {}
          }
          transition={isNearLimit ? { duration: 2.5, repeat: Infinity } : {}}
        >
          <AnimatePresence mode="wait">
            {isClearing ? (
              <motion.div
                key="spinning"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0, transition: SPRING_SOFT }}
                exit={{ opacity: 0, rotate: 90, transition: { duration: 0.15 } }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RotateCcw size={16} className="text-emerald-400" />
                </motion.div>
              </motion.div>
            ) : isEmpty ? (
              <motion.div
                key="empty-icon"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.3, scale: 1, transition: SPRING_SOFT }}
                exit={{ opacity: 0 }}
              >
                <RotateCcw size={15} className="text-white" />
              </motion.div>
            ) : isHovered ? (
              <motion.div
                key="clear-hint"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1, transition: SPRING_SOFT }}
                exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.12 } }}
              >
                <RotateCcw size={16} style={{ color: ringColor }} />
              </motion.div>
            ) : (
              <motion.div
                key="count"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1, transition: SPRING_SOFT }}
                exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.12 } }}
                className="flex items-center leading-none"
              >
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ color: ringColor }}
                >
                  {Math.round(pct * 100)}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>

      {/* ── Hover tooltip — floats above, zero layout impact ── */}
      <AnimatePresence>
        {isHovered && !isEmpty && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT }}
            exit={{ opacity: 0, y: 4, scale: 0.95, transition: { duration: 0.12 } }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 rounded-xl border border-white/10 px-3.5 py-2 backdrop-blur-xl whitespace-nowrap pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span className="text-[11px] font-semibold" style={{ color: ringColor }}>
              {Math.round(pct * 100)}% used · {messageCount}/{CONTEXT_LIMIT}
            </span>
            <span className="text-[10px] text-white/40">Tap to clear context</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
