import type { Topic } from '@/types'

// Static team roster — update names here if your team changes
export const TEAM_MEMBERS = [
  { id: 1, name: 'Sarah Chen',     avatar: 'SC', role: 'Content Lead',     team: 'content' },
  { id: 2, name: 'Marcus Johnson', avatar: 'MJ', role: 'UI Designer',      team: 'ui'      },
  { id: 3, name: 'Priya Patel',    avatar: 'PP', role: 'Senior Developer',  team: 'dev'     },
  { id: 4, name: 'Alex Rivera',    avatar: 'AR', role: 'Content Writer',   team: 'content' },
  { id: 5, name: 'Zoe Williams',   avatar: 'ZW', role: 'UI/UX Designer',   team: 'ui'      },
  { id: 6, name: 'James Kim',      avatar: 'JK', role: 'DevOps Engineer',  team: 'dev'     },
]

const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-rose-500',  'bg-amber-500',  'bg-cyan-500',
]

const teamColors: Record<string, string> = {
  content: 'bg-violet-100 text-violet-700',
  ui:      'bg-sky-100 text-sky-700',
  dev:     'bg-emerald-100 text-emerald-700',
}

interface Props { topics: Topic[] }

export default function TeamActivity({ topics }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Team Activity</h3>
        <p className="text-xs text-slate-400 mt-0.5">This month&apos;s contributions</p>
      </div>

      <div className="space-y-3">
        {TEAM_MEMBERS.map((member, i) => {
          const assigned  = topics.filter(t => t.assignee === member.name).length
          const published = topics.filter(t => t.assignee === member.name && t.status === 'Published').length
          const pct = assigned > 0 ? Math.round((published / assigned) * 100) : 0

          return (
            <div key={member.id} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-slate-700 truncate">{member.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${teamColors[member.team]}`}>{member.team}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{published}/{assigned}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
