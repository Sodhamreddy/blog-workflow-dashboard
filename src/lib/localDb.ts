import fs from 'fs'
import path from 'path'
import type { Topic, Notification, TopicComment, CommentReply } from '@/types'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

interface DbData {
  topics:        Topic[]
  notifications: Notification[]
}

function load(): DbData {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    const empty: DbData = { topics: [], notifications: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbData
  } catch {
    return { topics: [], notifications: [] }
  }
}

function save(data: DbData): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ─── Topics ──────────────────────────────────────────────────────────────────

export function dbGetTopics(): Topic[] {
  const db = load()
  return [...db.topics].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function dbInsertTopic(
  fields: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at'>> & { title: string }
): Topic {
  const db  = load()
  const now = new Date().toISOString()
  const topic: Topic = {
    id:               uuid(),
    views:            0,
    generated_date:   now,
    created_at:       now,
    updated_at:       now,
    status:           'Pending',
    current_team:     'content',
    priority:         'Medium',
    client:           'Kleza',
    content_approved: false,
    seo_approved:     false,
    comments:         [],
    assignee:         null,
    category:         null,
    keywords:         null,
    seo_title:        null,
    content:          null,
    blog_content:     null,
    deadline:         null,
    ...fields,
  }
  db.topics.push(topic)
  save(db)
  return topic
}

export function dbUpdateTopic(id: string, patch: Partial<Topic>): Topic | null {
  const db = load()
  const i  = db.topics.findIndex(t => t.id === id)
  if (i === -1) return null
  db.topics[i] = { ...db.topics[i], ...patch, updated_at: new Date().toISOString() }
  save(db)
  return db.topics[i]
}

export function dbDeleteTopic(id: string): boolean {
  const db  = load()
  const len = db.topics.length
  db.topics = db.topics.filter(t => t.id !== id)
  if (db.topics.length < len) { save(db); return true }
  return false
}

// ─── Comments ────────────────────────────────────────────────────────────────

export function dbAddComment(
  topicId: string,
  fields: { author: string; text: string }
): TopicComment | null {
  const db = load()
  const i  = db.topics.findIndex(t => t.id === topicId)
  if (i === -1) return null

  if (!Array.isArray(db.topics[i].comments)) db.topics[i].comments = []

  const comment: TopicComment = {
    id:         uuid(),
    created_at: new Date().toISOString(),
    replies:    [],
    ...fields,
  }
  db.topics[i].comments.push(comment)
  db.topics[i].updated_at = new Date().toISOString()
  save(db)
  return comment
}

export function dbAddReply(
  topicId: string,
  commentId: string,
  fields: { author: string; text: string }
): CommentReply | null {
  const db = load()
  const ti = db.topics.findIndex(t => t.id === topicId)
  if (ti === -1) return null

  const comments = db.topics[ti].comments ?? []
  const ci = comments.findIndex(c => c.id === commentId)
  if (ci === -1) return null

  const reply: CommentReply = {
    id:         uuid(),
    created_at: new Date().toISOString(),
    ...fields,
  }
  comments[ci].replies.push(reply)
  db.topics[ti].updated_at = new Date().toISOString()
  save(db)
  return reply
}

export function dbDeleteComment(topicId: string, commentId: string): boolean {
  const db = load()
  const i  = db.topics.findIndex(t => t.id === topicId)
  if (i === -1) return false
  const before = (db.topics[i].comments ?? []).length
  db.topics[i].comments = (db.topics[i].comments ?? []).filter(c => c.id !== commentId)
  if (db.topics[i].comments.length < before) { save(db); return true }
  return false
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function dbGetNotifications(): Notification[] {
  const db = load()
  return [...db.notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function dbInsertNotification(
  fields: Omit<Notification, 'id' | 'created_at'>
): Notification {
  const db   = load()
  const notif: Notification = {
    id:         uuid(),
    created_at: new Date().toISOString(),
    ...fields,
  }
  db.notifications.push(notif)
  save(db)
  return notif
}

export function dbMarkRead(id?: string): void {
  const db = load()
  if (id) {
    const i = db.notifications.findIndex(n => n.id === id)
    if (i !== -1) db.notifications[i].read = true
  } else {
    db.notifications.forEach(n => { n.read = true })
  }
  save(db)
}

export function dbDeleteNotification(id: string): boolean {
  const db  = load()
  const len = db.notifications.length
  db.notifications = db.notifications.filter(n => n.id !== id)
  if (db.notifications.length < len) { save(db); return true }
  return false
}
