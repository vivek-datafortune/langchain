import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../../lib/stores/authStore'
import { getSpeechRecognition } from '../speechUtils'
import { WAKE_PHRASE } from '../constants'
import type { Phase } from '../constants'
import type { AnySpeechRecognition } from '../speechUtils'

export function useWakeWordListener(
  phase: Phase,
  showPhoneInput: boolean,
  startActiveListening: () => void,
  setError: (msg: string | null) => void,
  /** When false, do not start recognition (e.g. still loading /me). Avoids starting mic during load and getting spurious not-allowed. */
  enabled: boolean
) {
  // true = Speech API missing entirely (Chrome/Edge only)
  const [supported, setSupported] = useState(true)
  // true = user denied mic — recoverable, just needs reload after granting
  const [permissionDenied, setPermissionDenied] = useState(false)

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (!enabled || phase !== 'idle' || showPhoneInput) return

    // Each new attempt starts with a clean state so a transient not-allowed (e.g. from cleanup) doesn't stick
    setPermissionDenied(false)

    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setSupported(false)
      return
    }

    const recognition = new Ctor() as AnySpeechRecognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // Track whether this instance was denied so onend doesn't restart
    let denied = false

    // Accumulate recent transcripts so we detect "hi there" even when API returns "hi" and "there" in separate results
    const MAX_BUFFER_LEN = 80
    let transcriptBuffer = ''

    recognition.onresult = (event: {
      resultIndex: number
      results: { length: number; [i: number]: { 0: { transcript: string } } }
    }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim()
        if (transcript.includes(WAKE_PHRASE)) {
          recognition.stop()
          startActiveListening()
          return
        }
        transcriptBuffer = (transcriptBuffer + ' ' + transcript).trim().toLowerCase()
        if (transcriptBuffer.length > MAX_BUFFER_LEN) {
          transcriptBuffer = transcriptBuffer.slice(-MAX_BUFFER_LEN)
        }
        if (transcriptBuffer.includes(WAKE_PHRASE)) {
          recognition.stop()
          startActiveListening()
          return
        }
      }
    }

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        denied = true
        setPermissionDenied(true)
        // Don't touch `supported` — this is recoverable once the user grants mic
      }
    }

    recognition.onend = () => {
      transcriptBuffer = ''
      // Don't restart if permission was denied — avoids an infinite error loop
      if (!denied && phaseRef.current === 'idle' && !useAuthStore.getState().showPhoneInput) {
        try {
          recognition.start()
        } catch { /* ignore */ }
      }
    }

    try {
      recognition.start()
    } catch {
      setSupported(false)
    }

    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      try {
        recognition.stop()
      } catch { /* ignore */ }
    }
  }, [enabled, phase, showPhoneInput, startActiveListening, setError])

  return { supported, permissionDenied }
}
