'use client'

import { useState } from 'react'
import { X, Sparkles, CheckCircle2, Tag, Search, FileText, Wand2 } from 'lucide-react'
import type { Topic } from '@/types'

interface Props {
  topic: Topic
  onClose: () => void
  onSave?: (updated: Partial<Topic>) => Promise<void>
}

export default function BlogEditorModal({ topic, onClose, onSave }: Props) {
  const [title,     setTitle]     = useState(topic.title)
  const [seoTitle,  setSeoTitle]  = useState(topic.seo_title ?? '')
  const [keywords,  setKeywords]  = useState((topic.keywords ?? []).join(', '))
  const [content,   setContent]   = useState(
    topic.content ??
    `## Introduction\n\nThis guide explores ${topic.title.toLowerCase()}.\n\n## Key Points\n\n- …\n\n## Conclusion\n\n…`
  )
  const [generating, setGenerating] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [approved,   setApproved]   = useState(false)

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    await onSave({ title, seo_title: seoTitle, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), content })
    setSaving(false)
  }

  async function handleApprove() {
    if (!onSave) return
    setSaving(true)
    await onSave({ title, seo_title: seoTitle, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), content, status: 'Approved' })
    setApproved(true)
    setSaving(false)
    setTimeout(onClose, 900)
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Blog Editor</h2>
            <p className="text-xs text-slate-400">Edit, approve, and generate blog content</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
              topic.status === 'Approved'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              topic.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200'          :
                                               'bg-amber-50 text-amber-700 border-amber-200'
            }`}>{topic.status}</span>
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">

            {/* Left: form */}
            <div className="p-6 space-y-5 border-r border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blog Title</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Search size={11} /> SEO Meta Title</span>
                </label>
                <input
                  type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <p className={`mt-1 text-[10px] ${seoTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                  {seoTitle.length}/60 characters{seoTitle.length > 60 ? ' — too long' : ''}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Tag size={11} /> Keywords</span>
                </label>
                <input
                  type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder="react, performance, 2026"
                  className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {keywords.split(',').filter(k => k.trim()).map((kw, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{kw.trim()}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                  <select defaultValue={topic.category ?? ''} className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                    {['Tech', 'Business', 'Healthcare', 'Marketing', 'HR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select defaultValue={topic.priority} className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                    {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned To</label>
                <select defaultValue={topic.assignee ?? ''} className="w-full px-3 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {['Sarah Chen', 'Alex Rivera', 'Marcus Johnson', 'Priya Patel', 'Zoe Williams', 'James Kim'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Right: content */}
            <div className="p-6 flex flex-col gap-4">
              <label className="block text-xs font-semibold text-slate-700">Content Draft</label>
              <textarea
                value={content} onChange={e => setContent(e.target.value)} rows={12}
                className="flex-1 w-full px-3 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none font-mono leading-relaxed"
              />
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Sparkles size={13} className="text-blue-500 shrink-0" />
                <p className="text-xs text-slate-500">
                  Click <strong className="text-slate-700">Generate Blog</strong> to have n8n AI create full content from your title and keywords.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {onSave && (
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              onClick={handleGenerate} disabled={generating}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${generating ? 'bg-blue-50 text-blue-400 border-blue-100 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}
            >
              {generating ? <><div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Generating…</> : <><Wand2 size={14} />Generate Blog</>}
            </button>
            <button
              onClick={handleApprove} disabled={approved || saving}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all ${approved ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <CheckCircle2 size={14} />{approved ? 'Approved!' : 'Approve Content'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
