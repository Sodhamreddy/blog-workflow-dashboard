import { NextResponse } from 'next/server'
import { dbGetTopics, dbInsertTopic } from '@/lib/localDb'

export async function GET() {
  return NextResponse.json(dbGetTopics())
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: '"title" is required' }, { status: 400 })
  }
  const topic = dbInsertTopic({
    title:        body.title.trim(),
    status:       body.status       ?? 'Pending',
    current_team: body.current_team ?? 'content',
    assignee:     body.assignee     ?? null,
    priority:     body.priority     ?? 'Medium',
    category:     body.category     ?? null,
    keywords:     body.keywords     ?? null,
    seo_title:    body.seo_title    ?? null,
    content:      body.content      ?? null,
    deadline:     body.deadline     ?? null,
  })
  return NextResponse.json(topic, { status: 201 })
}
