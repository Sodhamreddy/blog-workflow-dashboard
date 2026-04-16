'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search, Plus, ChevronDown, MessageSquare } from 'lucide-react'
import Link from 'next/link'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/':              { title: 'Dashboard',     subtitle: 'Overview of your content workflow' },
  '/topics':        { title: 'Topic Management', subtitle: 'Manage and approve blog topics' },
  '/workflow':      { title: 'Workflow Board',   subtitle: 'Team progress across all stages' },
  '/notifications': { title: 'Notifications',    subtitle: 'Alerts, approvals, and updates' },
  '/team':          { title: 'Team',             subtitle: 'Manage your content team' },
  '/analytics':     { title: 'Analytics',        subtitle: 'Performance and productivity metrics' },
  '/settings':      { title: 'Settings',         subtitle: 'Configure your workspace' },
}

export default function Header() {
  const pathname = usePathname()
  const page = pageTitles[pathname] ?? { title: 'BlogFlow', subtitle: '' }

  return (
    <header className="flex items-center gap-4 px-6 lg:px-8 h-16 bg-white border-b border-slate-200 shrink-0">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 leading-none">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{page.subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400 w-56 cursor-pointer hover:border-blue-300 hover:bg-white transition-all">
        <Search size={14} />
        <span className="text-xs">Search topics, blogs…</span>
        <kbd className="ml-auto text-[10px] text-slate-300 bg-slate-100 px-1 rounded font-mono">⌘K</kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Teams icon */}
        <button
          title="Microsoft Teams"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
        >
          <MessageSquare size={15} />
        </button>

        {/* Notifications */}
        <Link href="/notifications">
          <button className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all">
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
          </button>
        </Link>

        {/* Add topic */}
        <Link href="/topics">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm">
            <Plus size={14} />
            New Topic
          </button>
        </Link>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 cursor-pointer group">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold">
            AD
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Admin</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Content Lead</p>
          </div>
          <ChevronDown size={13} className="text-slate-400 hidden lg:block" />
        </div>
      </div>
    </header>
  )
}
