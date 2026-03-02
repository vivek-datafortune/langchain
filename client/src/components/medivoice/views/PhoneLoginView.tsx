import { motion } from 'framer-motion'
import { MediVoiceCard } from '../MediVoiceCard'
import { MediVoiceOrb } from '../MediVoiceOrb'
import { PhoneInputCard } from '../PhoneInputCard'
import type { Phase } from '../constants'

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 }

interface PhoneLoginViewProps {
  phase: Phase
  onStartListening: () => void
  phoneNumber: string
  onDigitChange: (v: string) => void
  shakeError: boolean
  loginError: boolean
  isLoggingIn?: boolean
}

export function PhoneLoginView({
  phase,
  onStartListening,
  phoneNumber,
  onDigitChange,
  shakeError,
  loginError,
  isLoggingIn = false,
}: PhoneLoginViewProps) {
  return (
    <MediVoiceCard
      maxWidth="560px"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING }}
      exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }}
    >
      <div className="flex flex-col items-center gap-8 px-8 py-12">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            transition: { ...SPRING, delay: 0.1 },
          }}
        >
          <MediVoiceOrb
            phase={phase}
            isLoggingIn={isLoggingIn}
            onStartListening={onStartListening}
          />
        </motion.div>

        {isLoggingIn ? (
          <motion.p
            key="logging-in"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              y: 0,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-center text-sm font-light tracking-wide text-white/70"
          >
            Checking your number…
          </motion.p>
        ) : (
          <motion.div
            key="phone-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            className="w-full"
          >
            <PhoneInputCard
              phoneNumber={phoneNumber}
              onDigitChange={onDigitChange}
              shakeError={shakeError}
              loginError={loginError}
            />
          </motion.div>
        )}
      </div>
    </MediVoiceCard>
  )
}
