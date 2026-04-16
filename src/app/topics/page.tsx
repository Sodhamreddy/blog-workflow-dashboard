'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Pencil, CheckCircle2, XCircle,
  Circle, Download, Zap, Loader2, X, ChevronRight,
  Clock, PenLine, Palette, BadgeCheck, Globe,
} from 'lucide-react'
import type { Topic, TopicStatus, Priority, ClientName, TeamType } from '@/types'
import { CLIENTS, ALL_MEMBERS } from '@/types'
import BlogEditorModal from '@/components/topics/BlogEditorModal'

// ─── Style maps ──────────────────────────────────────────────────────────────

const statusStyles: Record<TopicStatus, string> = {
  Pending:       'bg-amber-50 text-amber-700 border border-amber-200',
  Approved:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected:      'bg-red-50 text-red-600 border border-red-200',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  Published:     'bg-violet-50 text-violet-700 border border-violet-200',
}
const statusDot: Record<TopicStatus, string> = {
  Pending:       'bg-amber-400',
  Approved:      'bg-emerald-400',
  Rejected:      'bg-red-400',
  'In Progress': 'bg-blue-400',
  Published:     'bg-violet-400',
}
const priorityBadge: Record<Priority, string> = {
  High:   'text-red-600 bg-red-50 border border-red-200',
  Medium: 'text-amber-600 bg-amber-50 border border-amber-200',
  Low:    'text-emerald-600 bg-emerald-50 border border-emerald-200',
}
const priorityDot: Record<Priority, string> = {
  High:   'bg-red-500',
  Medium: 'bg-amber-500',
  Low:    'bg-emerald-500',
}
const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-rose-500',  'bg-amber-500',  'bg-cyan-500',
]

const clientColors: Record<ClientName, string> = {
  'Kleza':       'bg-blue-100 text-blue-700',
  'Interim HC':  'bg-violet-100 text-violet-700',
  'AHNS':        'bg-emerald-100 text-emerald-700',
  'StadiumRx':   'bg-rose-100 text-rose-700',
}

// ─── Pipeline flow config ────────────────────────────────────────────────────

type StageKey = 'pending' | 'content' | 'ui_ux' | 'manager' | 'published'

const PIPELINE_FLOW: {
  key:       StageKey
  label:     string
  sub:       string
  icon:      React.ElementType
  active:    string   // active bg + text
  inactive:  string   // inactive style
  dot:       string
  badge:     string
}[] = [
  {
    key:      'pending',
    label:    'Pending',
    sub:      'Awaiting approval',
    icon:     Clock,
    active:   'bg-amber-500 text-white shadow-amber-200',
    inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
    dot:      'bg-amber-500',
    badge:    'bg-amber-100 text-amber-700',
  },
  {
    key:      'content',
    label:    'Content Team',
    sub:      'Writing + SEO review',
    icon:     PenLine,
    active:   'bg-violet-500 text-white shadow-violet-200',
    inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50',
    dot:      'bg-violet-500',
    badge:    'bg-violet-100 text-violet-700',
  },
  {
    key:      'ui_ux',
    label:    'UI / UX',
    sub:      'Design & layout',
    icon:     Palette,
    active:   'bg-sky-500 text-white shadow-sky-200',
    inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50',
    dot:      'bg-sky-500',
    badge:    'bg-sky-100 text-sky-700',
  },
  {
    key:      'manager',
    label:    'Manager Approval',
    sub:      'Final sign-off',
    icon:     BadgeCheck,
    active:   'bg-emerald-500 text-white shadow-emerald-200',
    inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50',
    dot:      'bg-emerald-500',
    badge:    'bg-emerald-100 text-emerald-700',
  },
  {
    key:      'published',
    label:    'Blog Published',
    sub:      'Live on WordPress',
    icon:     Globe,
    active:   'bg-slate-700 text-white shadow-slate-300',
    inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50',
    dot:      'bg-slate-500',
    badge:    'bg-slate-100 text-slate-600',
  },
]

function matchesStage(t: Topic, stage: StageKey | null): boolean {
  if (!stage) return true
  if (stage === 'pending')   return t.status === 'Pending' && t.current_team === 'content'
  if (stage === 'content')   return t.current_team === 'content' && t.status !== 'Pending' && t.status !== 'Rejected'
  if (stage === 'ui_ux')     return t.current_team === 'ui_ux'
  if (stage === 'manager')   return t.current_team === 'manager'
  if (stage === 'published') return t.current_team === 'completed' || t.status === 'Published'
  return true
}

function countStage(topics: Topic[], stage: StageKey, clientFilter: ClientName | 'All'): number {
  return topics
    .filter(t => clientFilter === 'All' || (t.client ?? 'Kleza') === clientFilter)
    .filter(t => matchesStage(t, stage))
    .length
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TopicsPage() {
  const [topics,        setTopics]        = useState<Topic[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [stageFilter,   setStageFilter]   = useState<StageKey | null>(null)
  const [clientFilter,  setClientFilter]  = useState<ClientName | 'All'>('All')
  const [editing,       setEditing]       = useState<Topic | null>(null)
  const [addOpen,       setAddOpen]       = useState(false)
  const [newTitle,      setNewTitle]      = useState('')
  const [newClient,     setNewClient]     = useState<ClientName>('Kleza')
  const [newAssignee,   setNewAssignee]   = useState(ALL_MEMBERS[0])
  const [newPriority,   setNewPriority]   = useState<Priority>('Medium')
  const [adding,        setAdding]        = useState(false)

  // ── Fetch ───────────────────────────────────────────────────────────────────
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

  // ── Mutations ───────────────────────────────────────────────────────────────
  async function patchStatus(id: string, status: TopicStatus) {
    setTopics(ts => ts.map(t => t.id === id ? { ...t, status } : t))
    await fetch(`/api/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function handleEditorSave(id: string, patch: Partial<Topic>) {
    setTopics(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t))
    await fetch(`/api/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  async function addTopic() {
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), client: newClient, assignee: newAssignee, priority: newPriority }),
    })
    if (res.ok) {
      const topic = await res.json()
      setTopics(ts => [topic, ...ts])
      setAddOpen(false)
      setNewTitle('')
      setNewClient('Kleza')
      setNewAssignee(ALL_MEMBERS[0])
      setNewPriority('Medium')
    }
    setAdding(false)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const clientBase = topics.filter(t => clientFilter === 'All' || (t.client ?? 'Kleza') === clientFilter)

  const filtered = clientBase.filter(t => {
    const q = search.toLowerCase()
    return (t.title.toLowerCase().includes(q) || (t.assignee ?? '').toLowerCase().includes(q))
        && matchesStage(t, stageFilter)
  })

  const totalPending = topics.filter(t => t.status === 'Pending').length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Topic Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${topics.length} topics · ${totalPending} pending review`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTopics} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Refresh
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
            <Plus size={14} /> Add Topic
          </button>
        </div>
      </div>

      {/* ── Pipeline Flow Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {/* All button */}
          <button
            onClick={() => setStageFilter(null)}
            className={`shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              stageFilter === null
                ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="text-base font-bold leading-none">{clientBase.length}</span>
            <span className="text-[10px] font-medium">All Topics</span>
          </button>

          {PIPELINE_FLOW.map((stage, i) => {
            const Icon  = stage.icon
            const count = countStage(topics, stage.key, clientFilter)
            const active = stageFilter === stage.key
            return (
              <div key={stage.key} className="flex items-center shrink-0">
                {/* Arrow connector */}
                <ChevronRight size={16} className="text-slate-300 mx-0.5 shrink-0" />
                {/* Stage card */}
                <button
                  onClick={() => setStageFilter(active ? null : stage.key)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all shadow-sm ${
                    active ? stage.active + ' shadow-md' : stage.inactive
                  }`}
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                    active ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    <Icon size={13} className={active ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold leading-tight whitespace-nowrap">{stage.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        active ? 'bg-white/25 text-white' : stage.badge
                      }`}>{count}</span>
                    </div>
                    <span className={`text-[10px] leading-tight whitespace-nowrap ${active ? 'text-white/70' : 'text-slate-400'}`}>
                      {stage.sub}
                    </span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {/* Active stage indicator */}
        {stageFilter && (() => {
          const s = PIPELINE_FLOW.find(f => f.key === stageFilter)!
          return (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-slate-500">Showing <strong className="text-slate-700">{s.label}</strong> — {s.sub}</span>
              <button onClick={() => setStageFilter(null)} className="ml-auto text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <X size={10} /> Clear filter
              </button>
            </div>
          )
        })()}
      </div>

      {/* Client filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-1">
          <button onClick={() => setClientFilter('All')} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${clientFilter === 'All' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>All Clients</button>
          {CLIENTS.map(c => (
            <button key={c} onClick={() => setClientFilter(c)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${clientFilter === c ? clientColors[c] : 'text-slate-500 hover:bg-slate-100'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-1 max-w-sm">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              type="text" placeholder="Search topics or assignees…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Loading topics…</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Topic Title', 'Client', 'Stage', 'Generated', 'Status', 'Assignee', 'Priority', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((topic, i) => {
                  const clientKey = (topic.client ?? 'Kleza') as ClientName
                  // Determine which pipeline stage this topic is at
                  const stageInfo = (() => {
                    if (topic.status === 'Pending' && topic.current_team === 'content')                               return PIPELINE_FLOW[0]
                    if (topic.current_team === 'content' && topic.status !== 'Pending')                               return PIPELINE_FLOW[1]
                    if (topic.current_team === 'ui_ux')                                                               return PIPELINE_FLOW[2]
                    if (topic.current_team === 'manager')                                                             return PIPELINE_FLOW[3]
                    if (topic.current_team === 'completed' || topic.status === 'Published')                           return PIPELINE_FLOW[4]
                    return PIPELINE_FLOW[0]
                  })()
                  return (
                    <tr key={topic.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 shrink-0 mt-0.5"><Zap size={12} /></div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{topic.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{topic.category ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${clientColors[clientKey] ?? 'bg-slate-100 text-slate-600'}`}>{clientKey}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stageInfo.dot}`} />
                          <span className="text-[11px] text-slate-600 font-medium">{stageInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-xs text-slate-600">{fmtDate(topic.generated_date)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${statusStyles[topic.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[topic.status]}`} />{topic.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                            {topic.assignee ? topic.assignee.split(' ').map(n => n[0]).join('') : '?'}
                          </div>
                          <span className="text-xs text-slate-700 whitespace-nowrap">{topic.assignee ?? 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${priorityBadge[topic.priority]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[topic.priority]}`} />{topic.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setEditing(topic)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                            <Pencil size={11} /> Edit
                          </button>
                          {topic.status === 'Pending' && (
                            <>
                              <button onClick={() => patchStatus(topic.id, 'Approved')} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                                <CheckCircle2 size={11} /> Approve
                              </button>
                              <button onClick={() => patchStatus(topic.id, 'Rejected')} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                <XCircle size={11} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Circle size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-400">
                {topics.length === 0 ? 'No topics yet — n8n will push them here automatically' : 'No topics match your filter'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-400">Showing {filtered.length} of {topics.length} topics</p>
        </div>
      </div>

      {/* Blog Editor Modal */}
      {editing && (
        <BlogEditorModal
          topic={editing}
          allTopics={topics}
          onClose={() => { setEditing(null); fetchTopics() }}
          onSave={async (patch) => {
            await handleEditorSave(editing.id, patch)
            setEditing(prev => prev ? { ...prev, ...patch } : null)
          }}
        />
      )}

      {/* Add Topic Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[420px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-900">Add New Topic</h3>
              <button onClick={() => setAddOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Topic Title *</label>
                <textarea
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. How AI is transforming healthcare in 2025"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300 resize-none"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addTopic() }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Client</label>
                  <select value={newClient} onChange={e => setNewClient(e.target.value as ClientName)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40">
                    {CLIENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40">
                    {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign To</label>
                <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40">
                  {ALL_MEMBERS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setAddOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={addTopic} disabled={adding || !newTitle.trim()}
                className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {adding ? 'Adding…' : 'Add Topic'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Ctrl+Enter to submit</p>
          </div>
        </div>
      )}
    </div>
  )
}
