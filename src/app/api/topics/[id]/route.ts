import { NextResponse } from 'next/server'
import { dbUpdateTopic, dbDeleteTopic, dbInsertNotification } from '@/lib/localDb'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body  = await req.json()
  const topic = dbUpdateTopic(params.id, body)
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.status === 'Published') {
    dbInsertNotification({
      type:    'published',
      title:   'Blog published successfully',
      message: `"${topic.title}" is now live on the website.`,
      read:    false,
    })
  }
  if (body.status === 'Approved') {
    dbInsertNotification({
      type:    'approval',
      title:   'Topic approved',
      message: `"${topic.title}" was approved and moved to the UI team.`,
      read:    false,
    })
  }

  return NextResponse.json(topic)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const deleted = dbDeleteTopic(params.id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
