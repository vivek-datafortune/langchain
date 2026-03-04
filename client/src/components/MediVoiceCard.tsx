import { motion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Reusable glassmorphic card surface with physics-based animations
// ─────────────────────────────────────────────────────────────

interface MediVoiceCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  maxWidth?: string
  minHeight?: number
  maxHeight?: number
}

export function MediVoiceCard({
  children,
  maxWidth = '512px',
  minHeight,
  maxHeight,
  className = '',
  style = {},
  ...motionProps
}: MediVoiceCardProps) {
  return (
    <motion.div
      className={`w-full rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        maxWidth,
        minHeight,
        maxHeight,
        ...style,
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
