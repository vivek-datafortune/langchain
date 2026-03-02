import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

interface ActiveMicrophoneIndicatorProps {
  deviceLabel: string
  isListening: boolean
}

export function ActiveMicrophoneIndicator({
  deviceLabel,
  isListening,
}: ActiveMicrophoneIndicatorProps) {
  if (!isListening) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5"
    >
      <div className="relative">
        <Mic size={12} className="text-emerald-400" />
        <motion.div
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <span className="text-[10px] text-emerald-400/90 font-medium">
        {deviceLabel}
      </span>
    </motion.div>
  )
}
