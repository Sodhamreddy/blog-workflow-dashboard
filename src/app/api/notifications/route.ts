import { NextResponse } from 'next/server'
import { dbGetNotifications, dbMarkRead, dbDeleteNotification } from '@/lib/localDb'

export async function GET() {
  return NextResponse.json(dbGetNotifications())
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}))
  dbMarkRead(body.id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: '"id" required' }, { status: 400 })
  const deleted = dbDeleteNotification(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
