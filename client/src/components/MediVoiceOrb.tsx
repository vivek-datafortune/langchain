import { motion, AnimatePresence } from 'framer-motion'
import { Mic } from 'lucide-react'
import type { Variants } from 'framer-motion'
import type { Phase } from '../lib/constants'

const orbVariants: Variants = {
  idle: { scale: [1, 1.05, 1], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
  listening: { scale: [1, 1.12, 1], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const } },
  processing: { scale: [1, 1.08, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } },
}

const glowVariants: Variants = {
  idle: { opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
  listening: { opacity: [0.5, 0.9, 0.5], scale: [1, 1.3, 1], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const } },
  processing: { opacity: [0.4, 0.7, 0.4], scale: [1, 1.2, 1], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const } },
}

/** Animated waveform bars — replaces the generic Loader2 spin */
function WaveformLoader() {
  const barHeights = [0.4, 0.7, 1, 0.7, 0.4]

  return (
    <div className="flex items-center justify-center gap-[5px]">
      {barHeights.map((maxScale, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: 28,
            background: 'linear-gradient(to top, rgba(52,211,153,0.9), rgba(6,182,212,0.6))',
            boxShadow: '0 0 6px rgba(52,211,153,0.4)',
            originY: 1,
          }}
          animate={{
            scaleY: [maxScale * 0.3, maxScale, maxScale * 0.3],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )
}

export interface MediVoiceOrbProps {
  phase: Phase
  isLoggingIn: boolean
  onStartListening: () => void
}

export function MediVoiceOrb({ phase, isLoggingIn, onStartListening }: MediVoiceOrbProps) {
  const showWaveform = phase === 'processing' || isLoggingIn

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          background:
            phase === 'listening'
              ? 'radial-gradient(circle, rgba(52,211,153,0.4), transparent 70%)'
              : 'radial-gradient(circle, rgba(6,182,212,0.3), transparent 70%)',
        }}
        variants={glowVariants}
        animate={phase}
      />

      <AnimatePresence>
        {phase === 'listening' &&
          [0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute rounded-full border border-emerald-400/30"
              style={{ width: 140, height: 140 }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      <motion.button
        type="button"
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 140,
          height: 140,
          background:
            phase === 'listening'
              ? 'radial-gradient(circle at 30% 30%, #34d399, #059669, #047857)'
              : phase === 'processing'
                ? 'radial-gradient(circle at 30% 30%, #06b6d4, #0891b2, #0e7490)'
                : 'radial-gradient(circle at 30% 30%, #10b981, #0d9488, #0891b2)',
          boxShadow:
            phase === 'listening'
              ? '0 0 60px rgba(52,211,153,0.5), 0 0 120px rgba(52,211,153,0.2)'
              : '0 0 40px rgba(6,182,212,0.3), 0 0 80px rgba(6,182,212,0.1)',
          cursor: phase === 'idle' ? 'pointer' : 'default',
        }}
        variants={orbVariants}
        animate={phase}
        whileTap={phase === 'idle' ? { scale: 0.95 } : undefined}
        onClick={() => { if (phase === 'idle') onStartListening() }}
      >
        <AnimatePresence mode="wait">
          {showWaveform ? (
            <motion.div
              key="waveform"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <WaveformLoader />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <Mic
                size={48}
                className={`transition-colors duration-300 ${
                  phase === 'listening' ? 'text-white' : 'text-white/80'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
