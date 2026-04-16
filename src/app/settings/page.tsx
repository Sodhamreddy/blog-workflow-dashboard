import { Settings, Zap, Bell, Users, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your workspace preferences and integrations</p>
      </div>

      <div className="space-y-4">
        {[
          { icon: Zap, label: 'n8n Integration', desc: 'Configure webhook URL and topic generation settings', badge: 'Connected', badgeColor: 'bg-emerald-50 text-emerald-700' },
          { icon: Bell, label: 'Notifications', desc: 'Microsoft Teams, email alerts, and reminder schedules', badge: 'Active', badgeColor: 'bg-blue-50 text-blue-700' },
          { icon: Users, label: 'Team Roles', desc: 'Manage role-based access for content, UI, and dev teams', badge: null, badgeColor: '' },
          { icon: Shield, label: 'Security', desc: 'Authentication, API keys, and access logs', badge: null, badgeColor: '' },
        ].map(({ icon: Icon, label, desc, badge, badgeColor }) => (
          <div key={label} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover cursor-pointer transition-shadow">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100">
              <Icon size={18} className="text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            {badge && (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>{badge}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
