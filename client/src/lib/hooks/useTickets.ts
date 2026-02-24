import { useState, useCallback, useEffect } from 'react'
import { getTickets, updateTicketStatus as apiUpdateStatus } from '../api'
import type { TicketItem, TicketStatus } from '../types'

export function useTickets(autoFetch = false) {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { tickets: data, total: count } = await getTickets()
      setTickets(data)
      setTotal(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: TicketStatus) => {
      setUpdatingId(id)
      // Optimistic update
      setTickets(prev => prev.map(t => (t.id === id ? { ...t, status } : t)))
      try {
        await apiUpdateStatus(id, status)
      } catch {
        // Rollback on error
        fetchTickets()
        throw new Error('Failed to update ticket status')
      } finally {
        setUpdatingId(null)
      }
    },
    [fetchTickets]
  )

  useEffect(() => {
    if (autoFetch) fetchTickets()
  }, [autoFetch, fetchTickets])

  // Computed stats
  const openCount = tickets.filter(t => t.status === 'Open').length
  const highCount = tickets.filter(t => t.priority === 'High').length
  const doneCount = tickets.filter(t => t.status === 'Done').length
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length

  return {
    tickets,
    total,
    loading,
    error,
    updatingId,
    fetchTickets,
    updateStatus,
    stats: { openCount, highCount, doneCount, inProgressCount },
  }
}
