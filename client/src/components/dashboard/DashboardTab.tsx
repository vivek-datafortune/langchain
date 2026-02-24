import { useMemo } from 'react'
import { Spinner, Alert, ScrollShadow } from '@heroui/react'
import { LayoutDashboard, Ticket, TrendingUp, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { useTickets } from '../../lib/hooks/useTickets'
import { MoodChart } from './MoodChart'
import { TicketTimeline } from './TicketTimeline'

function computeStats(tickets: { createdAt: string }[], total: number, doneCount: number) {
  const now = Date.now()
  const avgAge =
    tickets.length > 0
      ? Math.round(
          tickets.reduce((sum, t) => sum + (now - new Date(t.createdAt).getTime()), 0) /
            tickets.length /
            3_600_000
        )
      : 0
  const resolutionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0
  return { avgAge, resolutionRate }
}

export function DashboardTab() {
  const { tickets, total, loading, error, stats } = useTickets(true)

  const { avgAge, resolutionRate } = useMemo(
    () => computeStats(tickets, total, stats.doneCount),
    [tickets, total, stats.doneCount]
  )

  if (loading && tickets.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-6">
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    )
  }

  const kpis = [
    {
      label: 'Total Tickets',
      value: String(total),
      Icon: Ticket,
      gradient: 'linear-gradient(135deg, #818cf8, #38bdf8)',
      glow: 'rgba(129,140,248,0.3)',
    },
    {
      label: 'Resolution Rate',
      value: `${resolutionRate}%`,
      Icon: TrendingUp,
      gradient: resolutionRate >= 50
        ? 'linear-gradient(135deg, #34d399, #10b981)'
        : 'linear-gradient(135deg, #fbbf24, #f97316)',
      glow: resolutionRate >= 50 ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
    },
    {
      label: 'Avg. Age',
      value: `${avgAge}h`,
      Icon: Clock,
      gradient: 'linear-gradient(135deg, #a78bfa, #818cf8)',
      glow: 'rgba(167,139,250,0.3)',
    },
    {
      label: 'High Priority',
      value: String(stats.highCount),
      Icon: AlertCircle,
      gradient: stats.highCount > 0
        ? 'linear-gradient(135deg, #f43f5e, #ef4444)'
        : 'linear-gradient(135deg, #34d399, #10b981)',
      glow: stats.highCount > 0 ? 'rgba(244,63,94,0.3)' : 'rgba(52,211,153,0.3)',
    },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.15)',
            }}
          >
            <Sparkles size={24} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">No data yet</p>
            <p className="text-sm text-foreground/40">
              Submit messages in the Assistant tab to generate analytics.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI row — pinned above scroll */}
          <div className="mx-auto w-full max-w-4xl px-4 pb-4">
            <div
              className="grid grid-cols-2 divide-x divide-white/[0.06] overflow-hidden rounded-2xl sm:grid-cols-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {kpis.map(({ label, value, Icon, gradient, glow }) => (
                <div key={label} className="flex flex-col items-center gap-2 px-4 py-5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: gradient, boxShadow: `0 0 12px ${glow}` }}
                  >
                    <Icon size={14} strokeWidth={2} className="text-white" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-center text-[10px] font-medium uppercase tracking-wider text-foreground/35">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable charts */}
          <ScrollShadow className="flex-1 overflow-y-auto">
            <div className="mx-auto grid w-full max-w-4xl gap-4 px-4 pb-6 md:grid-cols-2">
              <MoodChart tickets={tickets} />
              <TicketTimeline tickets={tickets} />
            </div>
          </ScrollShadow>
        </>
      )}
    </div>
  )
}
