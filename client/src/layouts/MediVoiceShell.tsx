import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Stethoscope, ChevronLeft, Moon, Sun, Menu, Settings, LogOut } from 'lucide-react'
import { useTheme } from '../lib/hooks/useTheme'
import { useAuthStore } from '../lib/stores/authStore'
import { useMediVoiceSearchStore } from '../lib/stores/medivoiceSearchStore'

// Glassmorphic button base — complements the MediVoice card style
const glassButton =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 shadow-lg transition-all duration-200 hover:border-white/20 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/20'

const glassPanel =
  'absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded-xl border border-white/10 py-1 shadow-2xl backdrop-blur-xl'

export function MediVoiceShell() {
  const navigate = useNavigate()
  const { isDark, toggle: toggleTheme } = useTheme()
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const setSearchOpen = useMediVoiceSearchStore((s) => s.setOpen)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [setSearchOpen])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 shrink-0 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">

          {/* Back to home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
          >
            <ChevronLeft size={14} />
            Home
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <Stethoscope size={18} strokeWidth={2} className="text-emerald-400" />
            <div className="flex flex-col">
              <h1
                className="text-lg font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #34d399, #10b981, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                MediVoice
              </h1>
              <span className="text-[10px] text-muted">Medical voice assistant</span>
            </div>
          </div>

          {/* Nav: glassmorphic theme + hamburger menu */}
          <nav className="ml-auto flex items-center gap-2">
            {/* Theme toggle — glassmorphic */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={glassButton}
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              {isDark ? <Sun size={16} strokeWidth={2} className="text-amber-300/90" /> : <Moon size={16} strokeWidth={2} className="text-sky-400/90" />}
            </button>

            {/* Hamburger menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className={glassButton}
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Menu size={18} strokeWidth={2} className="text-foreground/80" />
              </button>
              {menuOpen && (
                <div
                  className={glassPanel}
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); /* TODO: open settings */ }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground/90 transition-colors hover:bg-white/10"
                  >
                    <Settings size={14} className="text-foreground/70" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400/90 transition-colors hover:bg-white/10"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
