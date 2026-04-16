import Link from 'next/link'
import { ArrowRight, Circle, Zap } from 'lucide-react'
import type { Topic, TopicStatus, Priority } from '@/types'

interface Props { topics: Topic[] }

const statusStyles: Record<TopicStatus, string> = {
  Pending:       'bg-amber-50 text-amber-700 border border-amber-200',
  Approved:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected:      'bg-red-50 text-red-600 border border-red-200',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  Published:     'bg-violet-50 text-violet-700 border border-violet-200',
}

const priorityColor: Record<Priority, string> = {
  High:   'text-red-500',
  Medium: 'text-amber-500',
  Low:    'text-emerald-500',
}

const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-rose-500',  'bg-amber-500',  'bg-cyan-500',
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function RecentTopics({ topics }: Props) {
  const recent = topics.slice(0, 6)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Recent Topics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest from n8n queue</p>
        </div>
        <Link href="/topics" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-8">
          <Zap size={28} className="mb-2" />
          <p className="text-sm font-medium">No topics yet</p>
          <p className="text-xs mt-1">n8n will push topics here automatically</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {recent.map((topic, i) => (
            <div key={topic.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                {topic.assignee ? topic.assignee.split(' ').map(n => n[0]).join('') : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate leading-none mb-1">{topic.title}</p>
                <p className="text-[11px] text-slate-400">{fmtDate(topic.generated_date)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Circle size={7} className={`fill-current ${priorityColor[topic.priority]}`} />
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[topic.status]}`}>{topic.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
