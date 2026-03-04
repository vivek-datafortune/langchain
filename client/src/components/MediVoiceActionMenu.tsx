import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Settings, LogOut, X } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Floating Action Button Menu (FAB) - Tablet optimized
// Radial expansion with staggered spring animations
// ─────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }
const SPRING_SOFT = { type: 'spring' as const, stiffness: 200, damping: 20 }

interface MenuItem {
  icon: typeof RotateCcw
  label: string
  color: string
  hoverColor: string
  onClick: () => void
}

interface MediVoiceActionMenuProps {
  onResetConversation: () => void
  onOpenSettings: () => void
  onLogout: () => void
  disabled?: boolean
}

export function MediVoiceActionMenu({
  onResetConversation,
  onOpenSettings,
  onLogout,
  disabled = false,
}: MediVoiceActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      icon: RotateCcw,
      label: 'Reset Chat',
      color: 'text-emerald-400',
      hoverColor: 'hover:bg-emerald-400/10 hover:border-emerald-400/30',
      onClick: () => {
        setIsOpen(false)
        onResetConversation()
      },
    },
    {
      icon: Settings,
      label: 'Settings',
      color: 'text-cyan-400',
      hoverColor: 'hover:bg-cyan-400/10 hover:border-cyan-400/30',
      onClick: () => {
        setIsOpen(false)
        onOpenSettings()
      },
    },
    {
      icon: LogOut,
      label: 'Logout',
      color: 'text-red-400',
      hoverColor: 'hover:bg-red-400/10 hover:border-red-400/30',
      onClick: () => {
        setIsOpen(false)
        onLogout()
      },
    },
  ]

  return (
    <>
      {/* Backdrop - Click anywhere to close */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="relative z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-full mt-4 flex flex-col gap-3 z-50"
            >
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, scale: 0, x: 20, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                    transition: {
                      ...SPRING,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    x: 20,
                    y: 20,
                    transition: { duration: 0.15, delay: (menuItems.length - 1 - index) * 0.03 },
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={item.onClick}
                  disabled={disabled}
                  className={`flex min-w-40 items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 shadow-xl backdrop-blur-xl transition-colors ${item.hoverColor} ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <Icon size={18} className={item.color} />
                  <span className="text-sm font-medium text-white/90">{item.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 shadow-2xl backdrop-blur-xl ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ background: 'rgba(255,255,255,0.1)' }}
        whileHover={!disabled ? { scale: 1.1 } : undefined}
        whileTap={!disabled ? { scale: 0.9 } : undefined}
        animate={
          isOpen
            ? { rotate: 0 }
            : {
                boxShadow: [
                  '0 0 20px rgba(16, 185, 129, 0.3)',
                  '0 0 30px rgba(16, 185, 129, 0.5)',
                  '0 0 20px rgba(16, 185, 129, 0.3)',
                ],
              }
        }
        transition={isOpen ? SPRING : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1, transition: SPRING_SOFT }}
              exit={{ rotate: 90, opacity: 0, transition: { duration: 0.15 } }}
            >
              <X size={24} className="text-white/90" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1, transition: SPRING_SOFT }}
              exit={{ rotate: -90, opacity: 0, transition: { duration: 0.15 } }}
              className="flex flex-col gap-1"
            >
              <motion.div
                className="h-0.5 w-5 rounded-full bg-emerald-400"
                animate={{ scaleX: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="h-0.5 w-5 rounded-full bg-emerald-400"
                animate={{ scaleX: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.div
                className="h-0.5 w-5 rounded-full bg-emerald-400"
                animate={{ scaleX: [1, 0.8, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
    </>
  )
}
