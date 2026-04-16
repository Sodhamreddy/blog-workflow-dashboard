'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { MonthlyChartData } from '@/types'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
)

interface Props { data: MonthlyChartData }

export default function ProductivityChart({ data }: Props) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Topics Generated',
        data: data.generated,
        backgroundColor: '#dbeafe',
        borderColor: '#93c5fd',
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Approved',
        data: data.approved,
        backgroundColor: '#e0e7ff',
        borderColor: '#a5b4fc',
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Published',
        data: data.published,
        backgroundColor: '#2563eb',
        borderColor: '#1d4ed8',
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10, boxHeight: 10, borderRadius: 4,
          usePointStyle: true, pointStyle: 'rectRounded' as const,
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          color: '#64748b', padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a', titleColor: '#f1f5f9', bodyColor: '#94a3b8',
        borderColor: '#1e293b', borderWidth: 1, padding: 10, cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter, system-ui, sans-serif' } },
      },
      y: {
        grid: { color: '#f1f5f9', lineWidth: 1 },
        border: { display: false, dash: [4, 4] },
        ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter, system-ui, sans-serif' }, stepSize: 5 },
        beginAtZero: true,
      },
    },
    barPercentage: 0.65,
    categoryPercentage: 0.75,
  }

  const isEmpty = data.generated.every(v => v === 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Team Productivity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Blog output over the last 6 months</p>
        </div>
        <div className="flex gap-1">
          {['6M', '3M', '1M'].map((t, i) => (
            <button key={t} className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${i === 0 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="h-52 relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
            <p className="text-sm font-medium">No data yet</p>
            <p className="text-xs mt-1">Topics will appear here once n8n starts generating them</p>
          </div>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  )
}
