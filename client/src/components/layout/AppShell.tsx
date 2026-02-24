import { type ReactNode, type Key } from 'react'
import { Tabs, Chip } from '@heroui/react'
import { Sparkles } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

type TabKey = 'assistant' | 'tickets' | 'dashboard'

interface AppShellProps {
  activeTab: TabKey
  onTabChange: (key: TabKey) => void
  ticketCount: number
  children: ReactNode
}

export function AppShell({ activeTab, onTabChange, ticketCount, children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 shrink-0 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">

            {/* Brand */}
            <div className="flex items-center gap-2.5">
              {/* Logo bubble */}
              <Sparkles size={18} strokeWidth={2} className="text-indigo-400" />
              <div className="flex flex-col">
                <h1
                  className="text-lg font-bold tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #f472b6, #818cf8, #38bdf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Alexa Feedback AI
                </h1>
                <span className="text-[10px] text-muted">AI-powered · intent detection</span>
              </div>
            </div>

            {/* Navigation tabs */}
            <Tabs
              className="ml-auto"
              selectedKey={activeTab}
              onSelectionChange={(key: Key) => onTabChange(key as TabKey)}
            >
              <Tabs.ListContainer className="rounded-full p-1">
                  <Tabs.List aria-label="Main navigation" className="gap-0.5">
                    <Tabs.Tab
                      id="assistant"
                      className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 outline-none text-foreground/40 hover:text-foreground/80 data-[selected=true]:text-white"
                    >
                      Assistant
                      <Tabs.Indicator
                        className="rounded-full -z-10"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #818cf8, #38bdf8)',
                          boxShadow: '0 0 16px rgba(99,102,241,0.45)',
                        }}
                      />
                    </Tabs.Tab>
                    <Tabs.Tab
                      id="tickets"
                      className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 outline-none text-foreground/40 hover:text-foreground/80 data-[selected=true]:text-white"
                    >
                      <span className="flex items-center gap-1.5">
                        Tickets
                        {ticketCount > 0 && (
                          <Chip size="sm" variant="soft" className="h-5 min-w-5 text-xs">
                            {ticketCount}
                          </Chip>
                        )}
                      </span>
                      <Tabs.Indicator
                        className="rounded-full -z-10"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #818cf8, #38bdf8)',
                          boxShadow: '0 0 16px rgba(99,102,241,0.45)',
                        }}
                      />
                    </Tabs.Tab>
                    <Tabs.Tab
                      id="dashboard"
                      className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 outline-none text-foreground/40 hover:text-foreground/80 data-[selected=true]:text-white"
                    >
                      Dashboard
                      <Tabs.Indicator
                        className="rounded-full -z-10"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #818cf8, #38bdf8)',
                          boxShadow: '0 0 16px rgba(99,102,241,0.45)',
                        }}
                      />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
            </Tabs>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
