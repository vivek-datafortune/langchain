import { motion, AnimatePresence } from 'framer-motion'
import { MediVoiceCard } from '../MediVoiceCard'
import { MediVoiceOrb } from '../MediVoiceOrb'
import { MediVoiceTranscript } from '../MediVoiceTranscript'
import { ActiveMicrophoneIndicator } from '../ActiveMicrophoneIndicator'
import type { Phase } from '../constants'
import type { MediVoiceUser, EnquiryStage, EnquiryResult } from '../../../lib/api'

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 }
const SPRING_SOFT = { type: 'spring' as const, stiffness: 180, damping: 18 }

interface MainViewProps {
  user: MediVoiceUser | null
  phase: Phase
  onStartListening: () => void
  statusText: string
  displayTranscript: string
  stageInfo: EnquiryStage | null
  enquiryResult: EnquiryResult | null
  error: string | null
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
}

export function MainView({
  user,
  phase,
  onStartListening,
  statusText,
  displayTranscript,
  stageInfo,
  enquiryResult,
  error,
  devices,
  selectedDeviceId,
}: MainViewProps) {
  const hasTranscriptPanel =
    phase === 'listening' ||
    phase === 'processing' ||
    (phase === 'idle' && !!enquiryResult)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row items-start justify-center gap-6 w-full max-w-7xl mx-auto"
    >
      {/* ── Left: Orb Card (Hero) ────────────────────────────── */}
      <MediVoiceCard
        maxWidth="440px"
        className="shrink-0 w-full md:w-auto"
        initial={{ opacity: 0, x: -30, scale: 0.95 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
          transition: { ...SPRING, delay: 0.1 },
        }}
        layout
        transition={SPRING_SOFT}
      >
        <div className="flex flex-col items-center gap-6 px-8 py-12">
          {/* Greeting */}
          <AnimatePresence>
            {user?.name && (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: SPRING,
                }}
                exit={{ opacity: 0, y: -6, scale: 0.95, transition: { duration: 0.2 } }}
                className="text-center"
              >
                <p className="text-xl font-semibold text-white/95">
                  Hi, {user.name}
                </p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1, transition: { delay: 0.3, duration: 0.5 } }}
                  className="mt-2 h-0.5 w-16 rounded-full bg-linear-to-r from-emerald-400 to-cyan-400"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orb */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: { ...SPRING, delay: user?.name ? 0.2 : 0.1 },
            }}
          >
            <MediVoiceOrb
              phase={phase}
              isLoggingIn={false}
              onStartListening={onStartListening}
            />
          </motion.div>

          {/* Status Text */}
          <motion.div
            key={statusText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, y: -4 }}
            className={`text-center text-sm font-medium tracking-wide transition-colors ${
              phase === 'listening'
                ? 'text-emerald-400'
                : phase === 'processing'
                  ? 'text-cyan-400'
                  : 'text-foreground/60'
            }`}
          >
            {statusText}
          </motion.div>

          {/* Keyboard Shortcut Hint */}
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 backdrop-blur-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <span className="uppercase tracking-wider text-white/30">Search</span>
              <span className="text-white/20">or</span>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                  {typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
                    ? 'Cmd'
                    : 'Ctrl'}
                </kbd>
                <span className="text-white/20">+</span>
                <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                  K
                </kbd>
              </div>
            </motion.div>
          )}

          {/* Active Microphone Indicator (shown when listening) */}
          <AnimatePresence>
            {phase === 'listening' && selectedDeviceId && (
              <ActiveMicrophoneIndicator
                deviceLabel={devices.find((d) => d.deviceId === selectedDeviceId)?.label || 'Microphone'}
                isListening={true}
              />
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING }}
                exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
                className="w-full rounded-xl border border-red-400/20 px-4 py-3 text-center text-sm text-red-400/90"
                style={{ background: 'rgba(239,68,68,0.05)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MediVoiceCard>

      {/* ── Right: Transcript Panel ──────────────────────────── */}
      <AnimatePresence mode="wait">
        {hasTranscriptPanel && (
          <MediVoiceCard
            key="transcript"
            maxWidth="620px"
            minHeight={240}
            maxHeight={600}
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              transition: { ...SPRING, delay: 0.15 },
            }}
            exit={{
              opacity: 0,
              x: 40,
              scale: 0.95,
              transition: { duration: 0.25 },
            }}
          >
            <MediVoiceTranscript
              phase={phase}
              displayTranscript={displayTranscript}
              stageInfo={stageInfo}
              enquiryResult={enquiryResult}
            />
          </MediVoiceCard>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
