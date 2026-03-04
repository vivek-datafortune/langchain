import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMediVoiceLogin } from '../hooks/api/useMediVoiceLogin'
import { useMediVoiceRecording } from '../hooks/api/useMediVoiceRecording'
import { useWakeWordListener } from '../hooks/api/useWakeWordListener'
import { useMicrophoneDevices } from '../hooks/api/useMicrophoneDevices'
import { MediVoiceSearchModal } from '../components/MediVoiceSearchModal'
import { MediVoiceSettingsPanel } from '../components/MediVoiceSettingsPanel'
import { UnsupportedBrowser } from '../components/UnsupportedBrowser'
import { LoadingView } from '../components/LoadingView'
import { PermissionDeniedView } from '../components/PermissionDeniedView'
import { PhoneLoginView } from '../components/PhoneLoginView'
import { MainView } from '../components/MainView'
import { getMe, clearConversation, getConversationCurrent } from '../lib/api'
import { useAuthStore } from '../lib/stores/authStore'
import { useMediVoiceHeaderActionsStore } from '../lib/stores/medivoiceHeaderActionsStore'
import { WAKE_PHRASE } from '../lib/constants'

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
  const queryClient = useQueryClient()
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

  const { data: conversationData } = useQuery({
    queryKey: ['medivoice', 'conversation', 'current'],
    queryFn: getConversationCurrent,
    enabled: isAuthenticated && !!user,
    staleTime: 30 * 1000,
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
    clearResult,
  } = useMediVoiceRecording(selectedDeviceId)

  // Reset conversation mutation
  const resetMutation = useMutation({
    mutationFn: clearConversation,
    onSuccess: () => {
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 3000)
      queryClient.setQueryData(['medivoice', 'conversation', 'current'], { messageCount: 0 })
      clearResult()
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to reset conversation')
    },
  })

  // Message count: from latest enquiry result, or from API (e.g. on load/refresh)
  const messageCount = enquiryResult?.conversationMessageCount ?? conversationData?.messageCount ?? 0
  console.log('[MediVoicePage] messageCount:', messageCount, '| enquiryResult?.conversationMessageCount:', enquiryResult?.conversationMessageCount, '| conversationData?.messageCount:', conversationData?.messageCount)

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

  const handleResetConversation = useCallback(() => {
    if (resetMutation.isPending || phase !== 'idle') return
    resetMutation.mutate()
  }, [resetMutation, phase])

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const showFAB = viewKey === 'main' && phase === 'idle'
  const setHeaderActions = useMediVoiceHeaderActionsStore((s) => s.setActions)

  useEffect(() => {
    if (showFAB) {
      setHeaderActions({
        show: true,
        messageCount,
        onClear: handleResetConversation,
        isClearing: resetMutation.isPending,
        onResetConversation: handleResetConversation,
        onOpenSettings: handleOpenSettings,
        onLogout: handleLogout,
        disabled: resetMutation.isPending,
      })
    } else {
      setHeaderActions(null)
    }
    return () => setHeaderActions(null)
  }, [
    showFAB,
    messageCount,
    resetMutation.isPending,
    setHeaderActions,
    handleResetConversation,
    handleOpenSettings,
    handleLogout,
  ])

  if (!supported) return <UnsupportedBrowser error={error} />

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
