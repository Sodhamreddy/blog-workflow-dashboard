/**
 * Data access layer — backed by local JSON file (no external database).
 * Safe to import in server components and API routes.
 */
import type { Topic, Notification, DashboardStats, MonthlyChartData } from '@/types'
import { dbGetTopics, dbGetNotifications } from '@/lib/localDb'

// ─── Topics ──────────────────────────────────────────────────────────────────

export async function getTopics(): Promise<Topic[]> {
  return dbGetTopics()
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  return dbGetNotifications()
}

// ─── Computed / aggregate helpers ────────────────────────────────────────────

export function computeStats(topics: Topic[]): DashboardStats {
  return {
    totalTopics:     topics.length,
    pendingApproval: topics.filter(t => t.status === 'Pending').length,
    inProgress:      topics.filter(t => t.status === 'In Progress').length,
    published:       topics.filter(t => t.status === 'Published').length,
  }
}

export function computeMonthlyChartData(topics: Topic[]): MonthlyChartData {
  const now = new Date()
  const labels: string[]    = []
  const generated: number[] = []
  const approved: number[]  = []
  const published: number[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleString('default', { month: 'short' }))

    const monthTopics = topics.filter(t => {
      const td = new Date(t.created_at)
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
    })

    generated.push(monthTopics.length)
    approved.push(monthTopics.filter(t => ['Approved', 'In Progress', 'Published'].includes(t.status)).length)
    published.push(monthTopics.filter(t => t.status === 'Published').length)
  }

  return { labels, generated, approved, published }
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hr ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}
