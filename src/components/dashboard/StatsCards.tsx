import { TrendingUp, TrendingDown, FileText, Clock, Zap, CheckCircle2 } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface Props { stats: DashboardStats; prevStats?: DashboardStats }

const cards = [
  { label: 'Total Topics Generated', key: 'totalTopics'     as const, icon: FileText,     iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    border: 'border-blue-100'    },
  { label: 'Pending Approval',        key: 'pendingApproval' as const, icon: Clock,         iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',   border: 'border-amber-100'   },
  { label: 'Blogs In Progress',       key: 'inProgress'      as const, icon: Zap,           iconBg: 'bg-violet-50',  iconColor: 'text-violet-600',  border: 'border-violet-100'  },
  { label: 'Published Blogs',         key: 'published'       as const, icon: CheckCircle2,  iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
]

export default function StatsCards({ stats, prevStats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(({ label, key, icon: Icon, iconBg, iconColor, border }) => {
        const value = stats[key]
        const prev  = prevStats?.[key] ?? 0
        const pct   = prev > 0 ? Math.round(((value - prev) / prev) * 100) : null
        const positive = pct === null ? true : pct >= 0

        return (
          <div key={key} className={`bg-white rounded-2xl border ${border} shadow-card p-5 flex flex-col gap-4 hover:shadow-card-hover transition-shadow`}>
            <div className="flex items-start justify-between">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>
                <Icon size={20} className={iconColor} />
              </div>
              {pct !== null && (
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${positive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                  {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {positive ? '+' : ''}{pct}%
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 leading-none mb-1">
                {value.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
