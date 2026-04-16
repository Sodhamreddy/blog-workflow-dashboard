'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Calendar, MoreHorizontal, Circle, Columns2, Loader2, ArrowRight } from 'lucide-react'
import type { Topic, TopicStatus, Priority, TeamType } from '@/types'

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMNS: { key: TeamType; label: string; bg: string; dot: string; badge: string; nextTeam?: TeamType; nextStatus?: TopicStatus }[] = [
  { key: 'content',   label: 'Content Team', bg: 'bg-violet-50 border-violet-200',  dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700',  nextTeam: 'ui',        nextStatus: 'In Progress' },
  { key: 'ui',        label: 'UI Team',      bg: 'bg-sky-50 border-sky-200',         dot: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700',         nextTeam: 'dev',       nextStatus: 'In Progress' },
  { key: 'dev',       label: 'Dev Team',     bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',  nextTeam: 'completed', nextStatus: 'Published'   },
  { key: 'completed', label: 'Completed',    bg: 'bg-slate-50 border-slate-200',     dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600'                                                        },
]

const priorityDot: Record<Priority, string> = { High: 'bg-red-500', Medium: 'bg-amber-500', Low: 'bg-emerald-500' }
const statusBadge: Record<TopicStatus, string> = {
  Pending:       'bg-amber-50 text-amber-700 border-amber-200',
  Approved:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected:      'bg-red-50 text-red-600 border-red-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Published:     'bg-violet-50 text-violet-700 border-violet-200',
}
const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500']

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const [topics,  setTopics]  = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/topics')
      const data = await res.json()
      setTopics(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally    { setLoading(false) }
  }, [])

  useEffect(() => { fetchTopics() }, [fetchTopics])

  // Move card to next team / mark published
  async function advanceCard(topic: Topic, nextTeam: TeamType, nextStatus: TopicStatus) {
    const patch = { current_team: nextTeam, status: nextStatus }
    setTopics(ts => ts.map(t => t.id === topic.id ? { ...t, ...patch } : t))
    await fetch(`/api/topics/${topic.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  // Derive kanban columns from topics
  const grouped: Record<TeamType, Topic[]> = {
    content:   topics.filter(t => t.current_team === 'content'   && t.status !== 'Rejected'),
    ui:        topics.filter(t => t.current_team === 'ui'),
    dev:       topics.filter(t => t.current_team === 'dev'),
    completed: topics.filter(t => t.current_team === 'completed' || t.status === 'Published'),
  }

  const total = Object.values(grouped).reduce((s, arr) => s + arr.length, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading workflow board…</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workflow Board</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} active tasks across 4 teams</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTopics} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Columns2 size={13} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
            <Plus size={13} /> Add Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col gap-3">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${col.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-slate-700">{col.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{grouped[col.key].length}</span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2.5">
              {grouped[col.key].length === 0 && (
                <div className="py-8 text-center text-slate-300 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs">No tasks here</p>
                </div>
              )}
              {grouped[col.key].map((topic, i) => {
                const isOverdue = topic.deadline ? new Date(topic.deadline) < new Date() : false
                return (
                  <div key={topic.id} className="kanban-card bg-white rounded-xl border border-slate-100 shadow-card p-4 hover:shadow-card-hover transition-shadow">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${priorityDot[topic.priority]}`} />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{topic.category ?? '—'}</span>
                      </div>
                      <button className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"><MoreHorizontal size={13} /></button>
                    </div>
                    {/* Title */}
                    <p className="text-sm font-medium text-slate-800 leading-snug mb-3 line-clamp-2">{topic.title}</p>
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border mb-3 ${statusBadge[topic.status]}`}>
                      <Circle size={5} className="fill-current" />{topic.status}
                    </span>
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                        <Calendar size={11} />
                        {topic.deadline ? new Date(topic.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No deadline'}
                        {isOverdue && <span className="ml-0.5 text-[9px] bg-red-50 text-red-500 px-1 rounded-full">Overdue</span>}
                      </div>
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold ${avatarColors[i % avatarColors.length]}`} title={topic.assignee ?? ''}>
                        {getInitials(topic.assignee)}
                      </div>
                    </div>
                    {/* Advance button */}
                    {col.nextTeam && col.nextStatus && (
                      <button
                        onClick={() => advanceCard(topic, col.nextTeam!, col.nextStatus!)}
                        className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
                      >
                        Move to {COLUMNS.find(c => c.key === col.nextTeam)?.label} <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add card */}
            <button className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-white hover:border hover:border-slate-200 rounded-xl transition-all border border-dashed border-slate-200">
              <Plus size={13} /> Add card
            </button>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-5 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority:</p>
        {[{ label: 'High', dot: 'bg-red-500' }, { label: 'Medium', dot: 'bg-amber-500' }, { label: 'Low', dot: 'bg-emerald-500' }].map(({ label, dot }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
