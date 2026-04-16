'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Bold, Italic, Underline, Link2, List, ListOrdered,
  Heading2, Heading3, Eraser, FileText, Send, Trash2,
  CornerDownRight, CheckCircle2, MessageSquare,
} from 'lucide-react'
import type { Topic, TopicComment, ClientName } from '@/types'
import { PIPELINE_STAGES, CLIENTS, ALL_MEMBERS } from '@/types'

interface Props {
  topic:     Topic
  allTopics: Topic[]
  onClose:   () => void
  onSave?:   (patch: Partial<Topic>) => Promise<void>
}

// ─── Stage tracker ────────────────────────────────────────────────────────────

function StageTracker({ topic }: { topic: Topic }) {
  const currentIdx = (() => {
    if (topic.status === 'Pending')   return 0
    if (topic.current_team === 'content')   return 1
    if (topic.current_team === 'ui_ux')     return 2
    if (topic.current_team === 'manager')   return 3
    if (topic.current_team === 'completed' || topic.status === 'Published') return 4
    return 0
  })()

  return (
    <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-100 bg-slate-50/60 overflow-x-auto">
      {PIPELINE_STAGES.map((stage, i) => (
        <div key={stage.key} className="flex items-center gap-0 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
            i === currentIdx
              ? 'bg-blue-600 text-white shadow-sm'
              : i < currentIdx
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400'
          }`}>
            {i < currentIdx ? <CheckCircle2 size={9} /> : <span className="w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>}
            {stage.label}
          </div>
          {i < PIPELINE_STAGES.length - 1 && (
            <div className={`w-6 h-px mx-0.5 ${i < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Rich text toolbar button ─────────────────────────────────────────────────

function ToolbarBtn({ onClick, title, active, children }: {
  onClick: () => void
  title: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`flex items-center justify-center w-7 h-7 rounded-md text-sm font-medium transition-all ${
        active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Comments panel ───────────────────────────────────────────────────────────

function CommentsPanel({ topic, onUpdated }: { topic: Topic; onUpdated: () => void }) {
  const [comments,    setComments]    = useState<TopicComment[]>(topic.comments ?? [])
  const [text,        setText]        = useState('')
  const [author,      setAuthor]      = useState(ALL_MEMBERS[0])
  const [replyTo,     setReplyTo]     = useState<string | null>(null)
  const [replyText,   setReplyText]   = useState('')
  const [replyAuthor, setReplyAuthor] = useState(ALL_MEMBERS[0])
  const [submitting,  setSubmitting]  = useState(false)

  useEffect(() => { setComments(topic.comments ?? []) }, [topic.comments])

  async function submit() {
    if (!text.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/topics/${topic.id}/comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text: text.trim() }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [...prev, { ...c, replies: [] }])
      setText('')
      onUpdated()
    }
    setSubmitting(false)
  }

  async function submitReply(commentId: string) {
    if (!replyText.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/topics/${topic.id}/comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: replyAuthor, text: replyText.trim(), replyTo: commentId }),
    })
    if (res.ok) {
      const r = await res.json()
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...c.replies, r] } : c))
      setReplyTo(null)
      setReplyText('')
      onUpdated()
    }
    setSubmitting(false)
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/topics/${topic.id}/comments`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    })
    setComments(prev => prev.filter(c => c.id !== commentId))
    onUpdated()
  }

  function fmtTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={13} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-700">Comments &amp; Replies</span>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{comments.length}</span>
      </div>

      {/* Comment list */}
      <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">No comments yet — be the first!</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white">
                  {c.author.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-[10px] font-semibold text-slate-700">{c.author}</span>
                <span className="text-[9px] text-slate-400">{fmtTime(c.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-[9px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5">
                  <CornerDownRight size={9} /> Reply
                </button>
                <button onClick={() => deleteComment(c.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>

            {/* Replies */}
            {c.replies.length > 0 && (
              <div className="mt-2 pl-3 border-l-2 border-blue-100 space-y-2">
                {c.replies.map(r => (
                  <div key={r.id}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-[8px] font-bold text-white">
                        {r.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-700">{r.author}</span>
                      <span className="text-[8px] text-slate-400">{fmtTime(r.created_at)}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 pl-5">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {replyTo === c.id && (
              <div className="mt-2 pl-3 border-l-2 border-blue-100 flex flex-col gap-1.5">
                <select value={replyAuthor} onChange={e => setReplyAuthor(e.target.value)} className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none">
                  {ALL_MEMBERS.map(m => <option key={m}>{m}</option>)}
                </select>
                <div className="flex gap-1">
                  <input
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-300"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(c.id) } }}
                  />
                  <button onClick={() => submitReply(c.id)} disabled={submitting || !replyText.trim()} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    <Send size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add comment */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <select value={author} onChange={e => setAuthor(e.target.value)} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-300">
            {ALL_MEMBERS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
          />
          <button onClick={submit} disabled={submitting || !text.trim()} className="self-end p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Send size={13} />
          </button>
        </div>
        <p className="text-[9px] text-slate-400">Ctrl+Enter to send</p>
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function BlogEditorModal({ topic, allTopics, onClose, onSave }: Props) {
  const [title,     setTitle]     = useState(topic.title)
  const [seoTitle,  setSeoTitle]  = useState(topic.seo_title ?? '')
  const [keywords,  setKeywords]  = useState((topic.keywords ?? []).join(', '))
  const [client,    setClient]    = useState<ClientName>((topic.client ?? 'Kleza') as ClientName)
  const [priority,  setPriority]  = useState(topic.priority)
  const [assignee,  setAssignee]  = useState(topic.assignee ?? ALL_MEMBERS[0])
  const [saving,    setSaving]    = useState(false)
  const [linkDlg,   setLinkDlg]   = useState(false)
  const [linkUrl,   setLinkUrl]   = useState('')
  const [linkText,  setLinkText]  = useState('')
  const [intLinkDlg, setIntLinkDlg] = useState(false)
  const [topicVersion, setTopicVersion] = useState(topic)

  const editorRef  = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)

  // Initialise editor content once
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML =
        topic.blog_content ??
        topic.content ??
        `<h2>Introduction</h2><p>This article explores ${topic.title}.</p><h2>Key Points</h2><ul><li>Point 1</li><li>Point 2</li></ul><h2>Conclusion</h2><p>Summary here.</p>`
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Formatting helpers
  function fmt(cmd: string, val?: string) {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  function saveRange() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  function restoreRange() {
    const sel = window.getSelection()
    if (sel && savedRange.current) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    }
  }

  function openLinkDlg() {
    saveRange()
    const sel = window.getSelection()
    setLinkText(sel?.toString() ?? '')
    setLinkUrl('')
    setLinkDlg(true)
  }

  function insertExtLink() {
    if (!linkUrl) return
    restoreRange()
    if (linkText) {
      document.execCommand('insertHTML', false, `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline">${linkText}</a>`)
    } else {
      document.execCommand('createLink', false, linkUrl)
    }
    setLinkDlg(false)
    editorRef.current?.focus()
  }

  function insertIntLink(t: Topic) {
    restoreRange()
    document.execCommand('insertHTML', false,
      `<a href="#topic-${t.id}" style="color:#7c3aed;text-decoration:underline">${t.title}</a>`
    )
    setIntLinkDlg(false)
    editorRef.current?.focus()
  }

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    const blog_content = editorRef.current?.innerHTML ?? ''
    await onSave({
      title,
      seo_title:  seoTitle,
      keywords:   keywords.split(',').map(k => k.trim()).filter(Boolean),
      client,
      priority,
      assignee,
      blog_content,
      content: blog_content, // keep plain copy
    })
    setSaving(false)
  }

  const handleCommentUpdate = useCallback(() => {
    // refresh topic comments from server
    fetch(`/api/topics`)
      .then(r => r.json())
      .then((all: Topic[]) => {
        const updated = all.find(t => t.id === topic.id)
        if (updated) setTopicVersion(updated)
      })
  }, [topic.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-3 max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 shrink-0">
            <FileText size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 truncate">{topic.title}</h2>
            <p className="text-xs text-slate-400">Blog Editor</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Stage tracker */}
        <StageTracker topic={topic} />

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">

          {/* Left: metadata */}
          <div className="w-64 shrink-0 border-r border-slate-100 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Blog Title</label>
              <textarea value={title} onChange={e => setTitle(e.target.value)} rows={2}
                className="w-full px-2.5 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40 resize-none" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Client</label>
              <select value={client} onChange={e => setClient(e.target.value as ClientName)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40">
                {CLIENTS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                SEO Meta Title <span className={`${seoTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>({seoTitle.length}/60)</span>
              </label>
              <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Keywords</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)}
                placeholder="seo, keywords, comma-separated"
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {keywords.split(',').filter(k => k.trim()).map((kw, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{kw.trim()}</span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned To</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40">
                {ALL_MEMBERS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40">
                {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Right: editor + comments */}
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Editor toolbar */}
            <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-100 bg-slate-50/80 flex-wrap shrink-0">
              <ToolbarBtn onClick={() => fmt('bold')}          title="Bold (Ctrl+B)">      <Bold      size={13} /></ToolbarBtn>
              <ToolbarBtn onClick={() => fmt('italic')}        title="Italic (Ctrl+I)">    <Italic    size={13} /></ToolbarBtn>
              <ToolbarBtn onClick={() => fmt('underline')}     title="Underline (Ctrl+U)"> <Underline size={13} /></ToolbarBtn>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn onClick={() => fmt('formatBlock', 'h2')} title="Heading 2"> <Heading2 size={13} /></ToolbarBtn>
              <ToolbarBtn onClick={() => fmt('formatBlock', 'h3')} title="Heading 3"> <Heading3 size={13} /></ToolbarBtn>
              <ToolbarBtn onClick={() => fmt('formatBlock', 'p')}  title="Paragraph"> <span className="text-[11px] font-bold">P</span></ToolbarBtn>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn onClick={() => fmt('insertUnorderedList')}   title="Bullet list">   <List        size={13} /></ToolbarBtn>
              <ToolbarBtn onClick={() => fmt('insertOrderedList')}     title="Numbered list"> <ListOrdered size={13} /></ToolbarBtn>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn onClick={openLinkDlg}                  title="External link">  <Link2 size={13} /></ToolbarBtn>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); saveRange(); setIntLinkDlg(true) }}
                title="Internal link (another topic)"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-violet-600 hover:bg-violet-50 transition-all"
              >
                <Link2 size={11} /> Internal
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn onClick={() => fmt('removeFormat')} title="Clear formatting"><Eraser size={13} /></ToolbarBtn>
            </div>

            {/* Editor area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="flex-1 min-h-[300px] px-6 py-5 text-sm text-slate-700 leading-relaxed focus:outline-none blog-editor"
              style={{ fontFamily: 'inherit' }}
            />

            {/* Comments */}
            <div className="px-6 pb-6 shrink-0">
              <CommentsPanel topic={topicVersion} onUpdated={handleCommentUpdate} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Close
          </button>
          {onSave && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-60">
              {saving ? <>Saving…</> : <>Save Changes</>}
            </button>
          )}
        </div>
      </div>

      {/* External link dialog */}
      {linkDlg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setLinkDlg(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Insert External Link</h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Link Text</label>
                <input value={linkText} onChange={e => setLinkText(e.target.value)}
                  placeholder="Link display text"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">URL</label>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/40"
                  onKeyDown={e => { if (e.key === 'Enter') insertExtLink() }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setLinkDlg(false)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={insertExtLink} className="flex-1 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Internal link dialog */}
      {intLinkDlg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setIntLinkDlg(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Link to Another Topic</h3>
            <div className="space-y-1.5">
              {allTopics.filter(t => t.id !== topic.id).map(t => (
                <button key={t.id} onClick={() => insertIntLink(t)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition-all group">
                  <p className="text-xs font-medium text-slate-800 group-hover:text-violet-700 line-clamp-1">{t.title}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{t.client ?? 'Kleza'} · {t.status}</p>
                </button>
              ))}
              {allTopics.filter(t => t.id !== topic.id).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No other topics available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
