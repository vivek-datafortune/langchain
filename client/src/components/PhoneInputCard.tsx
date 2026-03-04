import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export interface PhoneInputCardProps {
  phoneNumber: string
  onDigitChange: (value: string) => void
  shakeError: boolean
  loginError: boolean
}

export function PhoneInputCard({
  phoneNumber,
  onDigitChange,
  shakeError,
  loginError,
}: PhoneInputCardProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 10 }, (_, i) => phoneNumber[i] ?? '')

  useEffect(() => {
    const idx = phoneNumber.length < 10 ? phoneNumber.length : 9
    inputRefs.current[idx]?.focus()
  }, [phoneNumber])

  const handleKeyDown = (_i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (phoneNumber.length > 0) onDigitChange(phoneNumber.slice(0, -1))
    } else if (/^\d$/.test(e.key) && phoneNumber.length < 10) {
      e.preventDefault()
      onDigitChange(phoneNumber + e.key)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10)
    if (pasted) onDigitChange(pasted)
  }

  return (
    <motion.div
      animate={{ x: shakeError ? [-6, 6, -6, 6, -3, 3, 0] : 0 }}
      transition={{ x: shakeError ? { duration: 0.5, ease: 'easeOut' } : undefined }}
      className="relative w-full overflow-hidden rounded-2xl border px-5 py-6 backdrop-blur-xl"
      style={{
        background: loginError ? 'rgba(248,113,113,0.05)' : 'rgba(128,128,128,0.08)',
        borderColor: (shakeError || loginError) ? 'rgba(248,113,113,0.5)' : 'rgba(128,128,128,0.2)',
        boxShadow: (shakeError || loginError) ? '0 0 20px rgba(248,113,113,0.15)' : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s, background 0.3s',
      }}
    >
      {/* ── Digits + labels ──────────────────────────────── */}
      <p
        className={`mb-4 text-center text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
          loginError ? 'text-red-400/80' : 'text-foreground/40'
        }`}
      >
        {loginError ? 'Incorrect number' : 'Enter your phone number'}
      </p>

      <div className="flex justify-center gap-1.5" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <motion.input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d || ''}
            readOnly
            onKeyDown={(e) => handleKeyDown(i, e)}
            animate={d ? { scale: [1, 1.15, 1], transition: { duration: 0.2 } } : {}}
            className={`h-11 w-9 rounded-lg border text-center text-lg font-semibold outline-none transition-all duration-300
              ${(shakeError || loginError)
                ? 'border-red-400/60 bg-red-400/10 text-red-500 dark:text-red-300'
                : d
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300'
                  : 'border-foreground/20 bg-foreground/5 text-foreground/60'}
              ${!(shakeError || loginError)
                ? 'focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30'
                : ''}
            `}
          />
        ))}
      </div>

      <p
        className={`mt-3 text-center text-[10px] transition-colors duration-300 ${
          loginError ? 'text-red-400/60' : 'text-foreground/25'
        }`}
      >
        {loginError ? 'Press backspace to edit and try again' : 'Type or speak your digits'}
      </p>

    </motion.div>
  )
}
