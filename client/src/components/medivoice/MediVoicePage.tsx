import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMediVoiceLogin, useMediVoiceRecording, useWakeWordListener, useMicrophoneDevices } from './hooks'
import { MediVoiceSearchModal } from './MediVoiceSearchModal'
import { MediVoiceActionMenu } from './MediVoiceActionMenu'
import { MediVoiceSettingsPanel } from './MediVoiceSettingsPanel'
import { UnsupportedBrowser } from './UnsupportedBrowser'
import { LoadingView, PermissionDeniedView, PhoneLoginView, MainView } from './views'
import { getMe, clearConversation } from '../../lib/api'
import { useAuthStore } from '../../lib/stores/authStore'
import { WAKE_PHRASE } from './constants'

// ─────────────────────────────────────────────────────────────
// MediVoice Page - Orchestrator Component
// Tablet-optimized with physics-based animations
// ─────────────────────────────────────────────────────────────

export function MediVoicePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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

  const { devices, selectedDeviceId, setSelectedDeviceId } = useMicrophoneDevices()

  // Reset conversation mutation
  const resetMutation = useMutation({
    mutationFn: clearConversation,
    onSuccess: () => {
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 3000)
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to reset conversation')
    },
  })

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
  } = useMediVoiceRecording(selectedDeviceId)

  const showMeLoader = isAuthenticated && !user && (isMeLoading || isMeFetching)
  const { supported, permissionDenied } = useWakeWordListener(
    phase,
    showPhoneInput,
    startActiveListening,
    setError,
    !showMeLoader
  )

  const statusText =
    phase === 'idle'
      ? resetSuccess
        ? 'Conversation reset!'
        : `Say "${WAKE_PHRASE}"`
      : phase === 'listening'
        ? 'Listening...'
        : stageInfo?.message ?? 'Processing...'

  const displayTranscript = interimTranscript || finalTranscript

  const viewKey: 'loading' | 'permission' | 'phone' | 'main' =
    showMeLoader ? 'loading'
    : permissionDenied ? 'permission'
    : showPhoneInput && phase === 'idle' ? 'phone'
    : 'main'

  const handleResetConversation = () => {
    if (resetMutation.isPending || phase !== 'idle') return
    resetMutation.mutate()
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!supported) return <UnsupportedBrowser error={error} />

  const showFAB = viewKey === 'main' && phase === 'idle'

  return (
    <>
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          {viewKey === 'loading' && <LoadingView key="loading" />}

          {viewKey === 'permission' && <PermissionDeniedView key="permission" />}

          {viewKey === 'phone' && (
            <PhoneLoginView
              key="phone"
              phase={phase}
              onStartListening={startActiveListening}
              phoneNumber={phoneNumber}
              onDigitChange={setPhoneNumber}
              shakeError={shakeError}
              loginError={loginError}
              isLoggingIn={loginMutation.isPending}
            />
          )}

          {viewKey === 'main' && (
            <MainView
              key="main"
              user={user}
              phase={phase}
              onStartListening={startActiveListening}
              statusText={statusText}
              displayTranscript={displayTranscript}
              stageInfo={stageInfo}
              enquiryResult={enquiryResult}
              error={error}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Menu */}
      {showFAB && (
        <MediVoiceActionMenu
          onResetConversation={handleResetConversation}
          onOpenSettings={handleOpenSettings}
          onLogout={handleLogout}
          disabled={resetMutation.isPending}
        />
      )}

      {/* Search Modal */}
      <MediVoiceSearchModal onSubmitTextQuery={submitTextQuery} />

      {/* Settings Panel */}
      <MediVoiceSettingsPanel
        isOpen={isSettingsOpen && phase === 'idle'}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={setSelectedDeviceId}
      />
    </>
  )
}
