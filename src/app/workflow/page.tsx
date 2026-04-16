'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, Loader2, CheckCircle2, Circle, Users, RefreshCw } from 'lucide-react'
import type { Topic, TeamType, TopicStatus, ClientName } from '@/types'
import { CLIENTS, CONTENT_TEAM, UIUX_TEAM, MANAGER, APPROVERS } from '@/types'
import BlogEditorModal from '@/components/topics/BlogEditorModal'

// ─── Pipeline column config ───────────────────────────────────────────────────

const COLUMNS: {
  key: string
  label: string
  sub: string
  members: string[]
  bg: string
  dot: string
  badge: string
  nextTeam?: TeamType
  nextStatus?: TopicStatus
}[] = [
  {
    key: 'pending',
    label: 'Pending Approval',
    sub: 'Awaiting Praveen / Divya',
    members: APPROVERS,
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'content',
    label: 'Content + SEO Review',
    sub: 'Content team writing · SEO checking',
    members: [...CONTENT_TEAM, 'SEO Team'],
    bg: 'bg-violet-50 border-violet-200',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    nextTeam: 'ui_ux',
    nextStatus: 'In Progress',
  },
  {
    key: 'ui_ux',
    label: 'UI/UX Team',
    sub: 'Design & layout review',
    members: UIUX_TEAM,
    bg: 'bg-sky-50 border-sky-200',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    nextTeam: 'manager',
    nextStatus: 'In Progress',
  },
  {
    key: 'manager',
    label: 'Manager Approval',
    sub: `Final sign-off by ${MANAGER}`,
    members: [MANAGER],
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    nextTeam: 'completed',
    nextStatus: 'Published',
  },
  {
    key: 'completed',
    label: 'Published',
    sub: 'Live on website',
    members: [],
    bg: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600',
  },
]

const clientColors: Record<ClientName, string> = {
  'Kleza':       'bg-blue-100 text-blue-700',
  'Interim HC':  'bg-violet-100 text-violet-700',
  'AHNS':        'bg-emerald-100 text-emerald-700',
  'StadiumRx':   'bg-rose-100 text-rose-700',
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const [topics,      setTopics]      = useState<Topic[]>([])
  const [loading,     setLoading]     = useState(true)
  const [clientFilter, setClientFilter] = useState<ClientName | 'All'>('All')
  const [editing,     setEditing]     = useState<Topic | null>(null)

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

  async function patch(id: string, updates: Partial<Topic>) {
    setTopics(ts => ts.map(t => t.id === id ? { ...t, ...updates } : t))
    await fetch(`/api/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  async function advanceCard(topic: Topic, nextTeam: TeamType, nextStatus: TopicStatus) {
    await patch(topic.id, { current_team: nextTeam, status: nextStatus })
  }

  const filtered = topics.filter(t =>
    clientFilter === 'All' || (t.client ?? 'Kleza') === clientFilter
  )

  // Group topics into columns
  function getColumnTopics(colKey: string): Topic[] {
    if (colKey === 'pending')   return filtered.filter(t => t.status === 'Pending' && t.current_team === 'content')
    if (colKey === 'content')   return filtered.filter(t => t.current_team === 'content' && t.status !== 'Pending' && t.status !== 'Rejected')
    if (colKey === 'ui_ux')     return filtered.filter(t => t.current_team === 'ui_ux')
    if (colKey === 'manager')   return filtered.filter(t => t.current_team === 'manager')
    if (colKey === 'completed') return filtered.filter(t => t.current_team === 'completed' || t.status === 'Published')
    return []
  }

  const total = COLUMNS.reduce((s, c) => s + getColumnTopics(c.key).length, 0)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm">Loading workflow board…</p>
    </div>
  )

  return (
    <div className="max-w-[1500px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workflow Board</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} active blogs · {COLUMNS.length}-stage pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Client filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-1 py-1">
            <button onClick={() => setClientFilter('All')} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${clientFilter === 'All' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>All</button>
            {CLIENTS.map(c => (
              <button key={c} onClick={() => setClientFilter(c)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${clientFilter === c ? clientColors[c] : 'text-slate-500 hover:bg-slate-100'}`}>{c}</button>
            ))}
          </div>
          <button onClick={fetchTopics} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-start">
        {COLUMNS.map(col => {
          const cards = getColumnTopics(col.key)
          return (
            <div key={col.key} className="flex flex-col gap-2.5">
              {/* Column header */}
              <div className={`rounded-xl border px-3 py-2.5 ${col.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold text-slate-700">{col.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{cards.length}</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1.5">{col.sub}</p>
                {col.members.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users size={9} className="text-slate-400" />
                    <span className="text-[9px] text-slate-400">{col.members.slice(0, 3).join(', ')}{col.members.length > 3 ? '…' : ''}</span>
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {cards.length === 0 && (
                  <div className="py-6 text-center text-slate-300 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs">No items</p>
                  </div>
                )}
                {cards.map(topic => (
                  <WorkflowCard
                    key={topic.id}
                    topic={topic}
                    col={col}
                    onAdvance={advanceCard}
                    onPatch={patch}
                    onEdit={() => { setEditing(topic) }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <BlogEditorModal
          topic={editing}
          allTopics={topics}
          onClose={() => { setEditing(null); fetchTopics() }}
          onSave={async (patch_) => {
            await patch(editing.id, patch_)
            setEditing(prev => prev ? { ...prev, ...patch_ } : null)
          }}
        />
      )}
    </div>
  )
}

// ─── Workflow card ─────────────────────────────────────────────────────────────

function WorkflowCard({
  topic, col, onAdvance, onPatch, onEdit,
}: {
  topic: Topic
  col:   (typeof COLUMNS)[0]
  onAdvance: (t: Topic, team: TeamType, status: TopicStatus) => Promise<void>
  onPatch:   (id: string, patch: Partial<Topic>) => Promise<void>
  onEdit: () => void
}) {
  const client    = (topic.client ?? 'Kleza') as ClientName
  const colorsMap = clientColors as Record<ClientName, string>
  const contentOk = topic.content_approved ?? false
  const seoOk     = topic.seo_approved ?? false
  const bothDone  = contentOk && seoOk

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 hover:shadow-md transition-shadow cursor-pointer group" onClick={onEdit}>
      {/* Client + priority */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${colorsMap[client] ?? 'bg-slate-100 text-slate-600'}`}>{client}</span>
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${topic.priority === 'High' ? 'bg-red-50 text-red-600' : topic.priority === 'Low' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{topic.priority}</span>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-slate-800 leading-snug mb-2 line-clamp-2">{topic.title}</p>

      {/* Assignee */}
      {topic.assignee && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white">{getInitials(topic.assignee)}</div>
          <span className="text-[10px] text-slate-500">{topic.assignee}</span>
        </div>
      )}

      {/* Dual approval (content stage only) */}
      {col.key === 'content' && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPatch(topic.id, { content_approved: !contentOk })}
              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-all ${contentOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'}`}
            >
              {contentOk ? <CheckCircle2 size={9} /> : <Circle size={9} />} Content
            </button>
            <button
              onClick={() => onPatch(topic.id, { seo_approved: !seoOk })}
              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-all ${seoOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'}`}
            >
              {seoOk ? <CheckCircle2 size={9} /> : <Circle size={9} />} SEO
            </button>
          </div>
          {bothDone && col.nextTeam && col.nextStatus && (
            <button
              onClick={() => onAdvance(topic, col.nextTeam!, col.nextStatus!)}
              className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              Move to UI/UX <ArrowRight size={9} />
            </button>
          )}
        </div>
      )}

      {/* Advance button (non-content stages) */}
      {col.key !== 'content' && col.key !== 'pending' && col.key !== 'completed' && col.nextTeam && col.nextStatus && (
        <div className="mt-2 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onAdvance(topic, col.nextTeam!, col.nextStatus!)}
            className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            {col.key === 'manager' ? 'Approve & Publish' : `Move to ${COLUMNS.find(c => c.key === col.nextTeam)?.label}`} <ArrowRight size={9} />
          </button>
        </div>
      )}
    </div>
  )
}
