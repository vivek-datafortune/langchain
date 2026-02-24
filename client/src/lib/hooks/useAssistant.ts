import { useState, useCallback } from 'react'
import { submitMessage } from '../api'
import type { FeedbackResult } from '../types'
import { useHistoryStore } from '../stores/historyStore'

export function useAssistant() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FeedbackResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isStreaming = false

  const addEntry = useHistoryStore((s) => s.addEntry)

  const submit = useCallback(async () => {
    const text = content.trim()
    if (!text || loading) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const data = await submitMessage(text)
      setResult(data)
      addEntry(text, data)
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [content, loading, addEntry])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setContent('')
  }, [])

  return {
    content,
    setContent,
    loading,
    result,
    error,
    isStreaming,
    submit,
    reset,
  }
}
