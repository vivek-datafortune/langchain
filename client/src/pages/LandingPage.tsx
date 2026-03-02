import { useNavigate } from 'react-router-dom'
import { Sparkles, Stethoscope, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { motion } from 'framer-motion'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold tracking-tight text-foreground/60">Apps</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #f472b6, #818cf8, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Choose an App
          </h1>
          <p className="mt-2 text-sm text-foreground/40">Select an application to continue</p>
        </motion.div>

        {/* App cards */}
        <motion.div 
          className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {/* Alexa Feedback AI */}
          <motion.button
            onClick={() => navigate('/assistant')}
            className="group flex flex-col gap-4 rounded-2xl p-6 text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(129,140,248,0.2)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 10px 30px -10px rgba(129,140,248,0.3)',
              borderColor: 'rgba(129,140,248,0.5)',
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(56,189,248,0.2))',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Alexa Feedback AI</p>
              <p className="mt-1 text-xs text-foreground/40">AI-powered intent detection &amp; ticket management</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-indigo-400">
              Open <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </motion.button>

          {/* MediVoice */}
          <motion.button
            onClick={() => navigate('/medivoice')}
            className="group flex flex-col gap-4 rounded-2xl p-6 text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(52,211,153,0.2)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 10px 30px -10px rgba(52,211,153,0.3)',
              borderColor: 'rgba(52,211,153,0.5)',
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.3), rgba(16,185,129,0.2))',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <Stethoscope size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">MediVoice</p>
              <p className="mt-1 text-xs text-foreground/40">Medical voice assistant &amp; patient records</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              Open <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
