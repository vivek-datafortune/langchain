import { useState, useRef, useCallback, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { enquireAudio, enquireText } from '../../../lib/api'
import { useAuthStore } from '../../../lib/stores/authStore'
import { getSpeechRecognition } from '../speechUtils'
import {
  SILENCE_TIMEOUT,
  NO_SPEECH_TIMEOUT,
} from '../constants'
import { playStartListeningSound, playStopListeningSound } from '../listeningSounds'
import type { Phase } from '../constants'
import type { AnySpeechRecognition } from '../speechUtils'
import type { EnquiryStage, EnquiryResult } from '../../../lib/api'

export function useMediVoiceRecording() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [stageInfo, setStageInfo] = useState<EnquiryStage | null>(null)
  const [enquiryResult, setEnquiryResult] = useState<EnquiryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [cookies] = useCookies(['medivoice_token'])
  const setShowPhoneInput = useAuthStore((s) => s.setShowPhoneInput)

  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noSpeechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<AnySpeechRecognition | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const phaseRef = useRef<Phase>('idle')

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const clearTimers = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
    if (noSpeechTimer.current) {
      clearTimeout(noSpeechTimer.current)
      noSpeechTimer.current = null
    }
  }, [])

  const stopRecorder = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null
      recognitionRef.current.onend = null
      recognitionRef.current.onerror = null
      try {
        recognitionRef.current.stop()
      } catch { /* already stopped */ }
      recognitionRef.current = null
    }
  }, [])

  const sendToEnquiry = useCallback(async (chunks: Blob[]) => {
    if (chunks.length === 0) {
      setPhase('idle')
      return
    }
    setPhase('processing')
    const blob = new Blob(chunks, { type: 'audio/webm' })

    await enquireAudio(blob, {
      onStage: (s) => setStageInfo(s),
      onResult: (r) => {
        setEnquiryResult(r)
        setStageInfo(null)
        setPhase('idle')
      },
      onError: (msg) => {
        setError(msg)
        setStageInfo(null)
        setPhase('idle')
      },
    })
  }, [])

  const submitTextQuery = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setEnquiryResult(null)
    setStageInfo(null)
    setError(null)
    setPhase('processing')
    await enquireText(trimmed, {
      onStage: (s) => setStageInfo(s),
      onResult: (r) => {
        setEnquiryResult(r)
        setStageInfo(null)
        setPhase('idle')
      },
      onError: (msg) => {
        setError(msg)
        setStageInfo(null)
        setPhase('idle')
      },
    })
  }, [])

  const startRecording = useCallback(async () => {
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const captured = [...chunksRef.current]
        chunksRef.current = []
        sendToEnquiry(captured)
      }
      recorder.start()
    } catch {
      setError('Microphone access denied')
      setPhase('idle')
    }
  }, [sendToEnquiry])

  const finishListening = useCallback(() => {
    if (phaseRef.current === 'listening') {
      playStopListeningSound()
    }
    clearTimers()
    stopRecognition()
    stopRecorder()
  }, [clearTimers, stopRecognition, stopRecorder])

  const startActiveListening = useCallback(() => {
    if (!cookies.medivoice_token) {
      setShowPhoneInput(true)
      return
    }

    // Clear previous answer — new question starts fresh
    setEnquiryResult(null)
    setStageInfo(null)
    setError(null)
    setPhase('listening')
    setInterimTranscript('')
    setFinalTranscript('')
    playStartListeningSound()

    startRecording()

    const Ctor = getSpeechRecognition()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    noSpeechTimer.current = setTimeout(() => {
      if (
        phaseRef.current === 'listening' &&
        !finalTranscript &&
        !interimTranscript
      ) {
        finishListening()
      }
    }, NO_SPEECH_TIMEOUT)

    recognition.onresult = (event: {
      resultIndex: number
      results: {
        length: number
        [i: number]: { isFinal: boolean; 0: { transcript: string } }
      }
    }) => {
      if (noSpeechTimer.current) {
        clearTimeout(noSpeechTimer.current)
        noSpeechTimer.current = null
      }
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interim += t
        }
      }
      if (final) setFinalTranscript((prev) => prev + final)
      setInterimTranscript(interim)
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      silenceTimer.current = setTimeout(finishListening, SILENCE_TIMEOUT)
    }

    recognition.onerror = (event: { error: string }) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(`Speech error: ${event.error}`)
      }
      if (event.error === 'no-speech') finishListening()
    }

    recognition.onend = () => {
      if (phaseRef.current === 'listening') finishListening()
    }

    recognition.start()
  }, [
    cookies.medivoice_token,
    startRecording,
    finishListening,
    finalTranscript,
    interimTranscript,
    setShowPhoneInput,
  ])

  useEffect(() => {
    return () => {
      clearTimers()
      stopRecognition()
      stopRecorder()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [clearTimers, stopRecognition, stopRecorder])

  return {
    phase,
    interimTranscript,
    finalTranscript,
    stageInfo,
    enquiryResult,
    error,
    setError,
    startActiveListening,
    submitTextQuery,
  }
}
