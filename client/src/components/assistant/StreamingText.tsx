import { useEffect, useState, useRef, useMemo } from 'react'

interface StreamingTextProps {
  text: string
  isStreaming: boolean
  speed?: number
}

export function StreamingText({ text, isStreaming, speed = 20 }: StreamingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(() =>
    isStreaming ? 0 : text.length
  )
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)

  // When not streaming, show full text immediately (computed, no effect needed)
  const effectiveLength = isStreaming ? displayedLength : text.length

  useEffect(() => {
    if (!isStreaming) {
      return
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current >= speed) {
        lastTimeRef.current = time
        setDisplayedLength(prev => {
          if (prev >= text.length) return prev
          return prev + 1
        })
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [text, isStreaming, speed])

  const shown = useMemo(() => text.slice(0, effectiveLength), [text, effectiveLength])

  return (
    <span className="whitespace-pre-wrap">
      {shown}
      {isStreaming && effectiveLength < text.length && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
      )}
    </span>
  )
}
