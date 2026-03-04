import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useCookies } from 'react-cookie'
import { loginWithPhone } from '../../lib/api'
import { useAuthStore } from '../../lib/stores/authStore'
import { getSpeechRecognition, parseSpokenDigits } from '../../lib/utils/speechUtils'
import type { AnySpeechRecognition } from '../../lib/utils/speechUtils'

export function useMediVoiceLogin() {
  const [shakeError, setShakeError] = useState(false)
  const [loginError, setLoginError] = useState(false)
  const voiceRecogRef = useRef<AnySpeechRecognition | null>(null)

  const [, setCookie] = useCookies(['medivoice_token'])
  const {
    showPhoneInput,
    phoneNumber,
    setAuthenticated,
    setUser,
    setShowPhoneInput,
    setPhoneNumber,
    resetPhoneInput,
  } = useAuthStore()

  const startVoiceDigitListener = useCallback(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    voiceRecogRef.current = recognition

    recognition.onresult = (event: {
      resultIndex: number
      results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }
    }) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript
      if (!transcript.trim()) return
      const digits = parseSpokenDigits(transcript)
      if (digits.length === 0) return
      const store = useAuthStore.getState()
      const current = store.phoneNumber
      if (digits.length <= current.length) return
      const toAdd = digits.slice(current.length).slice(0, 10 - current.length).join('')
      if (toAdd) store.setPhoneNumber(current + toAdd)
    }

    recognition.onerror = () => { /* ignore */ }
    recognition.onend = () => {
      if (useAuthStore.getState().showPhoneInput) {
        try {
          recognition.start()
        } catch { /* ignore */ }
      }
    }

    try {
      recognition.start()
    } catch { /* ignore */ }
  }, [])

  const stopVoiceDigitListener = useCallback(() => {
    if (voiceRecogRef.current) {
      voiceRecogRef.current.onresult = null
      voiceRecogRef.current.onend = null
      voiceRecogRef.current.onerror = null
      try {
        voiceRecogRef.current.stop()
      } catch { /* ignore */ }
      voiceRecogRef.current = null
    }
  }, [])

  const loginMutation = useMutation({
    mutationFn: (phone: string) => loginWithPhone(phone),
    retry: false,
    onSuccess: (response) => {
      setCookie('medivoice_token', response.data.token, { path: '/', maxAge: 7 * 86400 })
      setAuthenticated(true)
      setUser(response.data.user)
      setShowPhoneInput(false)
      resetPhoneInput()
      stopVoiceDigitListener()
    },
    onError: () => {
      setShakeError(true)
      setLoginError(true)
      setTimeout(() => setShakeError(false), 600)
    },
  })

  useEffect(() => {
    if (phoneNumber.length < 10) setLoginError(false)
  }, [phoneNumber])

  useEffect(() => {
    if (phoneNumber.length === 10 && !loginMutation.isPending && !loginError) {
      loginMutation.mutate(phoneNumber)
    }
  }, [phoneNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showPhoneInput) {
      stopVoiceDigitListener()
      return stopVoiceDigitListener
    }
    const t = setTimeout(() => startVoiceDigitListener(), 150)
    return () => {
      clearTimeout(t)
      stopVoiceDigitListener()
    }
  }, [showPhoneInput, startVoiceDigitListener, stopVoiceDigitListener])

  return {
    loginMutation,
    shakeError,
    loginError,
    stopVoiceDigitListener,
    showPhoneInput,
    phoneNumber,
    setPhoneNumber,
  }
}
