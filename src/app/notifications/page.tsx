'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, AlertCircle, CheckCircle2, Bell, Clock, MessageSquare, Check, Trash2, Loader2 } from 'lucide-react'
import type { Notification, NotifType } from '@/types'

const typeConfig: Record<NotifType, { icon: React.ElementType; iconBg: string; iconColor: string; label: string }> = {
  new_topic: { icon: Zap,           iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    label: 'n8n Topic'  },
  approval:  { icon: AlertCircle,   iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',   label: 'Approval'   },
  published: { icon: CheckCircle2,  iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', label: 'Published'  },
  teams:     { icon: MessageSquare, iconBg: 'bg-violet-50',  iconColor: 'text-violet-600',  label: 'Teams'      },
  reminder:  { icon: Clock,         iconBg: 'bg-slate-50',   iconColor: 'text-slate-600',   label: 'Reminder'   },
}

function relativeTime(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hr ago`
  return `${days}d ago`
}

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<NotifType | 'all'>('all')

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      setNotifs(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally    { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  async function markAll() {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  }

  async function markRead(id: string) {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  async function remove(id: string) {
    setNotifs(ns => ns.filter(n => n.id !== id))
    await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  const filtered    = notifs.filter(n => filter === 'all' || n.type === filter)
  const unreadCount = notifs.filter(n => !n.read).length

  const filters: { key: NotifType | 'all'; label: string }[] = [
    { key: 'all',       label: 'All'       },
    { key: 'new_topic', label: 'n8n Topics'},
    { key: 'approval',  label: 'Approvals' },
    { key: 'published', label: 'Published' },
    { key: 'teams',     label: 'Teams'     },
    { key: 'reminder',  label: 'Reminders' },
  ]

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread · ${notifs.length} total` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Teams banner */}
      <div className="flex items-center gap-4 p-4 mb-5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-violet-100 shadow-sm shrink-0">
          <MessageSquare size={18} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-violet-900">Microsoft Teams Connected</p>
          <p className="text-xs text-violet-600 mt-0.5">All workflow alerts sync to your Teams channel in real time via n8n.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">Live</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {filters.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${filter === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
            {label}
            {key !== 'all' && <span className="ml-1 text-[10px] opacity-60">({notifs.filter(n => n.type === key).length})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
          <Bell size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {notifs.length === 0 ? 'No notifications yet — they appear when n8n sends topics or team actions happen' : 'Nothing here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const cfg  = typeConfig[notif.type]
            const Icon = cfg.icon
            return (
              <div key={notif.id} className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all ${notif.read ? 'bg-white border-slate-100' : 'bg-blue-50/40 border-blue-100/80 shadow-sm'}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${cfg.iconBg}`}>
                  <Icon size={17} className={cfg.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-semibold leading-none ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                      notif.type === 'new_topic' ? 'bg-blue-100 text-blue-600'
                      : notif.type === 'approval' ? 'bg-amber-100 text-amber-600'
                      : notif.type === 'published' ? 'bg-emerald-100 text-emerald-600'
                      : notif.type === 'teams' ? 'bg-violet-100 text-violet-600'
                      : 'bg-slate-100 text-slate-500'
                    }`}>{cfg.label}</span>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className={`text-xs leading-relaxed mt-1 ${notif.read ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">{relativeTime(notif.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <button onClick={() => markRead(notif.id)} className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Check size={13} /></button>
                  )}
                  <button onClick={() => remove(notif.id)} className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
