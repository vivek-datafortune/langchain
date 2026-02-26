import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Mic } from 'lucide-react'
import { useMediVoiceLogin, useMediVoiceRecording, useWakeWordListener } from './hooks'
import { PhoneInputCard } from './PhoneInputCard'
import { MediVoiceOrb } from './MediVoiceOrb'
import { MediVoiceTranscript } from './MediVoiceTranscript'
import { MediVoiceSearchModal } from './MediVoiceSearchModal'
import { UnsupportedBrowser } from './UnsupportedBrowser'
import { getMe } from '../../lib/api'
import { useAuthStore } from '../../lib/stores/authStore'
import type { Phase } from './constants'
import type { MediVoiceUser, EnquiryStage, EnquiryResult } from '../../lib/api'

// ─────────────────────────────────────────────────────────────
const EASE = [0.32, 0.72, 0, 1] as const

// Shared card surface — each view owns its own instance
const CARD_CLASS = 'w-full rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl'
const CARD_STYLE = { background: 'rgba(255,255,255,0.04)' }

// Each view enters from slightly below and exits upward — feels like a physical swap
const VIEW_IN  = { opacity: 0, y: 18, scale: 0.97 }
const VIEW_OUT = { opacity: 0, y: -10, scale: 0.98 }
const VIEW_VISIBLE = {
  opacity: 1, y: 0, scale: 1,
  transition: { duration: 0.38, ease: EASE },
}
const VIEW_EXIT = { ...VIEW_OUT, transition: { duration: 0.22, ease: EASE } }

// ─────────────────────────────────────────────────────────────
// VIEWS — each is its own self-contained card
// ─────────────────────────────────────────────────────────────

/** Shown while /me is loading on page refresh */
function LoadingView() {
  return (
    <motion.div
      initial={VIEW_IN}
      animate={VIEW_VISIBLE}
      exit={VIEW_EXIT}
      className={`${CARD_CLASS} max-w-xs`}
      style={CARD_STYLE}
    >
      <div className="flex items-center justify-center px-10 py-10">
        <motion.p
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-center text-sm font-light tracking-wide text-white/70"
        >
          Hi there, we're getting things ready&nbsp;for you…
        </motion.p>
      </div>
    </motion.div>
  )
}

/** Shown when microphone permission is denied — user can grant then reload */
function PermissionDeniedView() {
  return (
    <motion.div
      initial={VIEW_IN}
      animate={VIEW_VISIBLE}
      exit={VIEW_EXIT}
      className={`${CARD_CLASS} max-w-xs`}
      style={CARD_STYLE}
    >
      <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/20"
          style={{ background: 'rgba(251,191,36,0.08)' }}
        >
          <Mic size={24} className="text-amber-400/80" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-white/80">Microphone access needed</p>
          <p className="text-xs text-white/35">
            Allow the mic in your browser, then reload to continue.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl border border-white/10 px-5 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/90"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          Reload page
        </button>
      </div>
    </motion.div>
  )
}

/** Shown while login API call is in-flight */
function LoginLoadingView({ phase, onStartListening }: { phase: Phase; onStartListening: () => void }) {
  return (
    <motion.div
      initial={VIEW_IN}
      animate={VIEW_VISIBLE}
      exit={VIEW_EXIT}
      className={`${CARD_CLASS} max-w-[448px]`}
      style={CARD_STYLE}
    >
      <div className="flex flex-col items-center gap-6 px-8 py-10">
        <MediVoiceOrb
          phase={phase}
          isLoggingIn={true}
          onStartListening={onStartListening}
        />
        <motion.p
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-center text-sm font-light tracking-wide text-white/70"
        >
          Checking your number…
        </motion.p>
      </div>
    </motion.div>
  )
}

/** Phone number input — wider card */
function PhoneView({
  phoneNumber,
  onDigitChange,
  shakeError,
  loginError,
  phase,
  onStartListening,
}: {
  phoneNumber: string
  onDigitChange: (v: string) => void
  shakeError: boolean
  loginError: boolean
  phase: Phase
  onStartListening: () => void
}) {
  return (
    <motion.div
      initial={VIEW_IN}
      animate={VIEW_VISIBLE}
      exit={VIEW_EXIT}
      className={`${CARD_CLASS} max-w-[512px]`}
      style={CARD_STYLE}
    >
      <div className="flex flex-col items-center gap-6 px-8 py-10">
        <MediVoiceOrb
          phase={phase}
          isLoggingIn={false}
          onStartListening={onStartListening}
        />
        <PhoneInputCard
          phoneNumber={phoneNumber}
          onDigitChange={onDigitChange}
          shakeError={shakeError}
          loginError={loginError}
        />
      </div>
    </motion.div>
  )
}

/** Main orb / transcript view — two-panel layout */
function MainView({
  user,
  phase,
  isLoggingIn,
  onStartListening,
  statusText,
  displayTranscript,
  stageInfo,
  enquiryResult,
  error,
}: {
  user: MediVoiceUser | null
  phase: Phase
  isLoggingIn: boolean
  onStartListening: () => void
  statusText: string
  displayTranscript: string
  stageInfo: EnquiryStage | null
  enquiryResult: EnquiryResult | null
  error: string | null
}) {
  const hasTranscriptPanel =
    (phase === 'listening') ||
    phase === 'processing' ||
    (phase === 'idle' && !!enquiryResult)

  return (
    // Outer wrapper handles view enter/exit; inner panels handle individual animations
    <motion.div
      initial={VIEW_IN}
      animate={VIEW_VISIBLE}
      exit={VIEW_EXIT}
      className="flex flex-col md:flex-row items-start gap-4"
    >

      {/* ── Left: Orb card ──────────────────────────────────── */}
      <motion.div
        layout
        transition={{ duration: 0.4, ease: EASE }}
        className={`${CARD_CLASS} w-full md:w-[360px] shrink-0`}
        style={CARD_STYLE}
      >
        <div className="flex flex-col items-center gap-6 px-8 py-10">

          {/* Greeting fades in after login */}
          <AnimatePresence>
            {user?.name && (
              <motion.p
                key="greeting"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
                className="text-lg font-medium text-white/90"
              >
                Hi, {user.name}
              </motion.p>
            )}
          </AnimatePresence>

          <MediVoiceOrb
            phase={phase}
            isLoggingIn={isLoggingIn}
            onStartListening={onStartListening}
          />

          {/* Status line crossfades on text change */}
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22 } }}
            exit={{ opacity: 0 }}
            className={`text-sm font-medium tracking-wide ${
              phase === 'listening'
                ? 'text-emerald-400'
                : phase === 'processing'
                  ? 'text-cyan-400'
                  : 'text-foreground/60'
            }`}
          >
            {statusText}
          </motion.p>

          <p className="text-[10px] text-white/25">
            {typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'}K to open search
          </p>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400/80"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* ── Right: Transcript panel — slides in beside the orb card ── */}
      <AnimatePresence>
        {hasTranscriptPanel && (
          <motion.div
            key="transcript-panel"
            initial={{ opacity: 0, x: 28, scale: 0.96 }}
            animate={{
              opacity: 1, x: 0, scale: 1,
              transition: { duration: 0.42, ease: EASE },
            }}
            exit={{
              opacity: 0, x: 28, scale: 0.96,
              transition: { duration: 0.26, ease: EASE },
            }}
            className={`${CARD_CLASS} w-full md:w-[580px] shrink-0 flex flex-col overflow-hidden`}
            style={{
              ...CARD_STYLE,
              minHeight: 200,
              maxHeight: 560,
            }}
          >
            <MediVoiceTranscript
              phase={phase}
              displayTranscript={displayTranscript}
              stageInfo={stageInfo}
              enquiryResult={enquiryResult}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export function MediVoicePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const {
    loginMutation,
    shakeError,
    loginError,
    showPhoneInput,
    phoneNumber,
    setPhoneNumber,
  } = useMediVoiceLogin()

  const { data: meData, isLoading: isMeLoading, isFetching: isMeFetching } = useQuery({
    queryKey: ['medivoice', 'me'],
    queryFn: getMe,
    enabled: isAuthenticated && !user,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (meData) setUser(meData)
  }, [meData, setUser])

  const {
    phase,
    interimTranscript,
    finalTranscript,
    stageInfo,
    enquiryResult,
    error,
    setError,
    startActiveListening,
    submitTextQuery,
  } = useMediVoiceRecording()

  const showMeLoader = isAuthenticated && !user && (isMeLoading || isMeFetching)
  const { supported, permissionDenied } = useWakeWordListener(
    phase,
    showPhoneInput,
    startActiveListening,
    setError,
    !showMeLoader // only start wake word / mic after we're done loading /me
  )

  const statusText =
    phase === 'idle'
      ? 'Say "Hi There"'
      : phase === 'listening'
        ? 'Listening...'
        : stageInfo?.message ?? 'Processing...'

  const displayTranscript = interimTranscript || finalTranscript

  const viewKey: 'loading' | 'logging-in' | 'permission' | 'phone' | 'main' =
    showMeLoader                            ? 'loading'
    : permissionDenied                      ? 'permission'
    : loginMutation.isPending               ? 'logging-in'
    : showPhoneInput && phase === 'idle'    ? 'phone'
    : 'main'

  // Only truly unsupported = Speech API not available at all (non-Chrome/Edge)
  if (!supported) return <UnsupportedBrowser error={error} />

  return (
    <>
    <div className="flex flex-1 items-center justify-center p-4 md:p-8">
      <AnimatePresence mode="wait">
        {viewKey === 'loading' && <LoadingView key="loading" />}

        {viewKey === 'permission' && <PermissionDeniedView key="permission" />}

        {viewKey === 'logging-in' && (
          <LoginLoadingView key="logging-in" phase={phase} onStartListening={startActiveListening} />
        )}

        {viewKey === 'phone' && (
          <PhoneView
            key="phone"
            phoneNumber={phoneNumber}
            onDigitChange={setPhoneNumber}
            shakeError={shakeError}
            loginError={loginError}
            phase={phase}
            onStartListening={startActiveListening}
          />
        )}

        {viewKey === 'main' && (
          <MainView
            key="main"
            user={user}
            phase={phase}
            isLoggingIn={loginMutation.isPending}
            onStartListening={startActiveListening}
            statusText={statusText}
            displayTranscript={displayTranscript}
            stageInfo={stageInfo}
            enquiryResult={enquiryResult}
            error={error}
          />
        )}
      </AnimatePresence>
    </div>
    <MediVoiceSearchModal onSubmitTextQuery={submitTextQuery} />
    </>
  )
}
