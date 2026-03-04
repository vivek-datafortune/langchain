import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Stethoscope, ChevronLeft } from 'lucide-react'
import { useMediVoiceSearchStore } from '../lib/stores/medivoiceSearchStore'
import { useMediVoiceHeaderActionsStore } from '../lib/stores/medivoiceHeaderActionsStore'
import { MediVoiceContextRing } from '../components/MediVoiceContextRing'
import { MediVoiceActionMenu } from '../components/MediVoiceActionMenu'
import { MediVoiceThemeToggle } from '../components/MediVoiceThemeToggle'

export function MediVoiceShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === '/'
  const setSearchOpen = useMediVoiceSearchStore((s) => s.setOpen)
  const headerActions = useMediVoiceHeaderActionsStore((s) => s.actions)

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

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 shrink-0 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">

          {/* Back to home — hidden when already at root */}
          {!isRoot && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
            >
              <ChevronLeft size={14} />
              Home
            </button>
          )}

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

          {/* Nav: Context Ring + Action Menu (from store) + theme toggle */}
          <nav className="ml-auto flex items-center gap-3">
            {headerActions?.show && (
              <>
                <MediVoiceContextRing
                  messageCount={headerActions.messageCount}
                  onClear={headerActions.onClear}
                  isClearing={headerActions.isClearing}
                />
                <MediVoiceActionMenu
                  onResetConversation={headerActions.onResetConversation}
                  onOpenSettings={headerActions.onOpenSettings}
                  onLogout={headerActions.onLogout}
                  disabled={headerActions.disabled}
                />
              </>
            )}
            <MediVoiceThemeToggle />
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
