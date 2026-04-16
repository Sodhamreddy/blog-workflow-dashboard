// Server component

import { getTopics, getNotifications, computeStats, computeMonthlyChartData, formatRelativeTime } from '@/lib/db'
import StatsCards from '@/components/dashboard/StatsCards'
import ProductivityChart from '@/components/dashboard/ProductivityChart'
import RecentTopics from '@/components/dashboard/RecentTopics'
import TeamActivity from '@/components/dashboard/TeamActivity'
import { Bell, Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { NotifType } from '@/types'

const notifIcons: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  new_topic: { icon: Zap,           bg: 'bg-blue-50',    color: 'text-blue-600'    },
  approval:  { icon: AlertCircle,   bg: 'bg-amber-50',   color: 'text-amber-600'   },
  published: { icon: CheckCircle2,  bg: 'bg-emerald-50', color: 'text-emerald-600' },
  teams:     { icon: Bell,          bg: 'bg-violet-50',  color: 'text-violet-600'  },
  reminder:  { icon: Bell,          bg: 'bg-slate-50',   color: 'text-slate-600'   },
}

export default async function DashboardPage() {
  const [topics, notifications] = await Promise.all([getTopics(), getNotifications()])
  const stats     = computeStats(topics)
  const chartData = computeMonthlyChartData(topics)
  const unread    = notifications.filter(n => !n.read).slice(0, 4)

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      {/* Welcome banner */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Good morning, Admin 👋</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Here&apos;s your content workflow overview.
          </p>
        </div>
        {stats.totalTopics > 0 && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
            <Zap size={13} />
            {stats.totalTopics} topics in the system
          </div>
        )}
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2"><ProductivityChart data={chartData} /></div>
        <div><RecentTopics topics={topics} /></div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><TeamActivity topics={topics} /></div>

        {/* Quick notifications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Recent Notifications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Unread alerts from your workflow</p>
            </div>
            <Link href="/notifications" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View all →
            </Link>
          </div>

          {unread.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={28} className="mx-auto text-emerald-300 mb-2" />
              <p className="text-sm text-slate-400">All caught up — no unread notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unread.map((n) => {
                const cfg  = notifIcons[n.type]
                const Icon = cfg.icon
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100/60 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${cfg.bg}`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-none mb-0.5">{n.title}</p>
                      <p className="text-xs text-slate-500 truncate">{n.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400">{formatRelativeTime(n.created_at)}</span>
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
