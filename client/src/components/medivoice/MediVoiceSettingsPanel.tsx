import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic } from 'lucide-react'
import { MicrophoneDeviceSelector } from './MicrophoneDeviceSelector'

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 22 }

interface MediVoiceSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
}

export function MediVoiceSettingsPanel({
  isOpen,
  onClose,
  devices,
  selectedDeviceId,
  onDeviceChange,
}: MediVoiceSettingsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                  <Mic size={20} className="text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-white/95">Settings</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/20 hover:text-white/90"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-3 text-sm font-medium text-white/70">Microphone Device</div>
              <MicrophoneDeviceSelector
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={onDeviceChange}
              />
              
              {/* Future settings can be added here */}
              <div className="mt-6 rounded-xl border border-white/5 px-4 py-3 text-xs text-white/40" style={{ background: 'rgba(255,255,255,0.02)' }}>
                More settings coming soon...
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
