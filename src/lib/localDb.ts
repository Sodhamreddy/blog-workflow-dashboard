/**
 * Local JSON file storage — no external database required.
 * Data is persisted in data/db.json relative to the project root.
 */
import fs from 'fs'
import path from 'path'
import type { Topic, Notification } from '@/types'

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
  fields: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'views' | 'generated_date'>
): Topic {
  const db  = load()
  const now = new Date().toISOString()
  const topic: Topic = {
    id:             uuid(),
    views:          0,
    generated_date: now,
    created_at:     now,
    updated_at:     now,
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
