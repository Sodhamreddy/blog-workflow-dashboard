'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Columns2,
  Bell,
  Users,
  BarChart2,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/',               icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/topics',         icon: FileText,        label: 'Topics'        },
  { href: '/workflow',       icon: Columns2,        label: 'Workflow'      },
  { href: '/notifications',  icon: Bell,            label: 'Notifications', badge: 3 },
  { href: '/team',           icon: Users,           label: 'Team'          },
  { href: '/analytics',      icon: BarChart2,       label: 'Analytics'     },
]

const recentTopics = [
  'React Performance 2026',
  'AI Healthcare Diagnostics',
  'Next.js 15 App Router',
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 h-screen bg-slate-900 shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">BlogFlow</span>
        <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">BETA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {badge}
                </span>
              )}
              {active && <ChevronRight size={14} className="shrink-0 opacity-60" />}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="my-4 border-t border-slate-800" />

        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Recent Topics
        </p>
        {recentTopics.map((t) => (
          <Link
            key={t}
            href="/topics"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all truncate"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
            <span className="truncate">{t}</span>
          </Link>
        ))}

        {/* Divider */}
        <div className="my-4 border-t border-slate-800" />

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Settings size={17} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-all">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Admin User</p>
            <p className="text-xs text-slate-500 truncate">admin@blogflow.io</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
        </div>
      </div>
    </aside>
  )
}
