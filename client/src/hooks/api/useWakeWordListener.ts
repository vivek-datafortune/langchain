import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../lib/stores/authStore'
import { getSpeechRecognition } from '../../lib/utils/speechUtils'
import { WAKE_PHRASE } from '../../lib/constants'
import type { Phase } from '../../lib/constants'
import type { AnySpeechRecognition } from '../../lib/utils/speechUtils'

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
  
  const recognitionRef = useRef<AnySpeechRecognition | null>(null)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isCleaningUpRef = useRef(false)

  useEffect(() => {
    console.log('🔍 [Wake Word] Effect dependencies changed:', {
      enabled,
      phase,
      showPhoneInput,
      willRun: enabled && phase === 'idle' && !showPhoneInput
    })
    
    if (!enabled || phase !== 'idle' || showPhoneInput) {
      console.log('⏸️ [Wake Word] Not starting - conditions not met')
      return
    }

    console.log('🔧 [Wake Word] Effect running with:', {
      enabled,
      phase,
      showPhoneInput,
      wakePhrase: WAKE_PHRASE
    })

    // Each new attempt starts with a clean state so a transient not-allowed (e.g. from cleanup) doesn't stick
    setPermissionDenied(false)
    isCleaningUpRef.current = false

    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      console.error('❌ [Wake Word] SpeechRecognition API not available')
      setSupported(false)
      return
    }

    const recognition = new Ctor() as AnySpeechRecognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    // Track whether this instance was denied so onend doesn't restart
    let denied = false
    let manualStop = false

    // Accumulate recent transcripts so we detect "hi there" even when API returns "hi" and "there" in separate results
    const MAX_BUFFER_LEN = 80
    let transcriptBuffer = ''
    
    const startRecognition = () => {
      if (isCleaningUpRef.current || manualStop) {
        console.log('⏹️ [Wake Word] Skip start - cleaning up or manually stopped')
        return
      }
      
      try {
        recognition.start()
        lastActivityRef.current = Date.now()
        console.log('🎙️ [Wake Word] Recognition started, listening for:', WAKE_PHRASE)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (message?.includes('already started')) {
          console.log('⚠️ [Wake Word] Recognition already started')
        } else {
          console.error('❌ [Wake Word] Failed to start recognition:', err)
          setSupported(false)
        }
      }
    }

    recognition.onresult = (event: {
      resultIndex: number
      results: { length: number; [i: number]: { isFinal?: boolean; 0: { transcript: string } } }
    }) => {
      lastActivityRef.current = Date.now()
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim()
        const isFinal = event.results[i].isFinal ?? false
        
        console.log('🎤 [Wake Word] Raw transcript:', {
          text: transcript,
          length: transcript.length,
          resultIndex: i,
          isFinal,
          timeSinceStart: Date.now() - lastActivityRef.current
        })
        
        if (transcript.includes(WAKE_PHRASE)) {
          console.log('✅ [Wake Word] DETECTED directly in transcript:', transcript)
          manualStop = true
          recognition.stop()
          startActiveListening()
          return
        }
        
        transcriptBuffer = (transcriptBuffer + ' ' + transcript).trim().toLowerCase()
        if (transcriptBuffer.length > MAX_BUFFER_LEN) {
          transcriptBuffer = transcriptBuffer.slice(-MAX_BUFFER_LEN)
        }
        
        console.log('📝 [Wake Word] Buffer updated:', {
          buffer: transcriptBuffer,
          bufferLength: transcriptBuffer.length,
          lookingFor: WAKE_PHRASE,
          containsPhrase: transcriptBuffer.includes(WAKE_PHRASE)
        })
        
        if (transcriptBuffer.includes(WAKE_PHRASE)) {
          console.log('✅ [Wake Word] DETECTED in buffer:', transcriptBuffer)
          manualStop = true
          recognition.stop()
          startActiveListening()
          return
        }
      }
    }

    recognition.onerror = (event: { error: string }) => {
      console.error('❌ [Wake Word] Recognition error:', {
        error: event.error,
        phase: phaseRef.current,
        timestamp: new Date().toISOString()
      })
      
      if (event.error === 'not-allowed') {
        denied = true
        setPermissionDenied(true)
        console.warn('⚠️ [Wake Word] Microphone permission denied')
      } else if (event.error === 'no-speech') {
        console.log('⚠️ [Wake Word] No speech timeout - normal, will restart')
      } else if (event.error === 'aborted') {
        console.log('⚠️ [Wake Word] Recognition aborted')
      }
    }

    recognition.onend = () => {
      transcriptBuffer = ''
      console.log('🔄 [Wake Word] Recognition ended', {
        wasDenied: denied,
        wasManualStop: manualStop,
        currentPhase: phaseRef.current,
        showingPhoneInput: useAuthStore.getState().showPhoneInput,
        isCleaningUp: isCleaningUpRef.current
      })
      
      if (!denied && 
          !manualStop && 
          phaseRef.current === 'idle' && 
          !useAuthStore.getState().showPhoneInput &&
          !isCleaningUpRef.current) {
        
        console.log('⏳ [Wake Word] Scheduling restart in 500ms...')
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = setTimeout(() => {
          if (!isCleaningUpRef.current && phaseRef.current === 'idle') {
            console.log('🔄 [Wake Word] Restarting...')
            startRecognition()
          }
        }, 500)
      } else {
        console.log('⏹️ [Wake Word] Not restarting')
      }
    }

    const heartbeatInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (timeSinceLastActivity > 30000 && 
          !isCleaningUpRef.current && 
          phaseRef.current === 'idle') {
        console.warn('⚠️ [Wake Word] Heartbeat detected stale recognition, restarting...')
        try {
          recognition.stop()
        } catch {
          startRecognition()
        }
      }
    }, 10000)

    startRecognition()

    return () => {
      console.log('🛑 [Wake Word] Cleaning up recognition listener')
      isCleaningUpRef.current = true
      manualStop = true
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      
      clearInterval(heartbeatInterval)
      
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      try {
        recognition.stop()
      } catch { /* ignore */ }
      recognitionRef.current = null
    }
  }, [enabled, phase, showPhoneInput, startActiveListening, setError])

  return { supported, permissionDenied }
}
