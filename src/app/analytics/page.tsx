import { getTopics } from '@/lib/db'
import ProductivityChart from '@/components/dashboard/ProductivityChart'
import TeamActivity from '@/components/dashboard/TeamActivity'
import { computeMonthlyChartData } from '@/lib/db'
import { TrendingUp, Eye } from 'lucide-react'

export default async function AnalyticsPage() {
  const topics    = await getTopics()
  const chartData = computeMonthlyChartData(topics)
  const published = topics.filter(t => t.status === 'Published')
  const totalViews = published.reduce((sum, t) => sum + (t.views ?? 0), 0)

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Content performance and team productivity metrics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Published Blogs',  value: published.length,  icon: TrendingUp, color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Total Page Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Avg Views / Blog', value: published.length ? Math.round(totalViews / published.length).toLocaleString() : 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Topics This Month', value: topics.filter(t => new Date(t.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ProductivityChart data={chartData} /></div>
        <div><TeamActivity topics={topics} /></div>
      </div>

      {/* Top published */}
      {published.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Published Blogs</h3>
          <div className="space-y-3">
            {published.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>{i + 1}</span>
                <p className="flex-1 text-sm text-slate-700 truncate">{t.title}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                  <Eye size={11} /> {(t.views ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
