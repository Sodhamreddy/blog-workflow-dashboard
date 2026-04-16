// Team Page

import { getTopics } from '@/lib/db'
import { TEAM_MEMBERS } from '@/components/dashboard/TeamActivity'
import { Users, Circle } from 'lucide-react'

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500']

const teamLabel: Record<string, string> = { content: 'Content Team', ui: 'UI Team', dev: 'Dev Team' }
const teamBadge: Record<string, string> = {
  content: 'bg-violet-100 text-violet-700',
  ui:      'bg-sky-100 text-sky-700',
  dev:     'bg-emerald-100 text-emerald-700',
}
const teamDotColor: Record<string, string> = {
  content: 'text-violet-700',
  ui:      'text-sky-700',
  dev:     'text-emerald-700',
}

export default async function TeamPage() {
  const topics = await getTopics()

  const grouped = TEAM_MEMBERS.reduce((acc, m) => {
    if (!acc[m.team]) acc[m.team] = []
    acc[m.team].push(m)
    return acc
  }, {} as Record<string, typeof TEAM_MEMBERS>)

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Team</h2>
          <p className="text-sm text-slate-500 mt-0.5">{TEAM_MEMBERS.length} members across 3 teams</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
          <Users size={13} /> Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([team, members]) => (
          <div key={team} className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
              <Circle size={8} className={`fill-current ${teamDotColor[team]}`} />
              <h3 className="text-sm font-semibold text-slate-800">{teamLabel[team]}</h3>
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${teamBadge[team]}`}>{members.length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {members.map((m, i) => {
                const memberTopics = topics.filter(t => t.assignee === m.name)
                const published    = memberTopics.filter(t => t.status === 'Published').length
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>{m.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.role}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700">{published}</p>
                      <p className="text-[10px] text-slate-400">published</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
