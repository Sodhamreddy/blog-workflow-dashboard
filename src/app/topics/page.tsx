'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Filter, Plus, ChevronDown, Pencil, CheckCircle2, XCircle,
  Circle, ArrowUpDown, Download, Zap, Loader2,
} from 'lucide-react'
import type { Topic, TopicStatus, Priority } from '@/types'
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
const ALL_STATUSES: TopicStatus[] = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Published']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TopicsPage() {
  const [topics,       setTopics]       = useState<Topic[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'All'>('All')
  const [editing,      setEditing]      = useState<Topic | null>(null)

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchTopics = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/topics')
      const data = await res.json()
      setTopics(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTopics() }, [fetchTopics])

  // ── Optimistic status updates ───────────────────────────────────────────────
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

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = topics.filter(t => {
    const q = search.toLowerCase()
    return (t.title.toLowerCase().includes(q) || (t.assignee ?? '').toLowerCase().includes(q))
        && (statusFilter === 'All' || t.status === statusFilter)
  })

  const counts = ALL_STATUSES.reduce((acc, s) => { acc[s] = topics.filter(t => t.status === s).length; return acc }, {} as Record<TopicStatus, number>)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Topic Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${topics.length} topics · ${counts['Pending'] ?? 0} pending review`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTopics} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
            <Plus size={14} /> Add Topic
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={() => setStatusFilter('All')} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${statusFilter === 'All' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
          All ({topics.length})
        </button>
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${statusFilter === s ? statusStyles[s] + ' shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[s]}`} />{s} ({counts[s] ?? 0})
          </button>
        ))}
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
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter size={13} /> Filter <ChevronDown size={11} className="text-slate-400" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <ArrowUpDown size={13} /> Sort
          </button>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Loading topics from Supabase…</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Topic Title', 'Generated', 'Status', 'Assignee', 'Priority', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((topic, i) => (
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
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Circle size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-400">
                {topics.length === 0 ? 'No topics yet — n8n will push them here automatically' : 'No topics match your search'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-400">Showing {filtered.length} of {topics.length} topics</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${p === 1 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Editor Modal */}
      {editing && (
        <BlogEditorModal
          topic={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => { await handleEditorSave(editing.id, patch); setEditing(null) }}
        />
      )}
    </div>
  )
}
