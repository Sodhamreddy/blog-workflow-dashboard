import { NextResponse } from 'next/server'
import { dbAddComment, dbAddReply, dbDeleteComment } from '@/lib/localDb'

// POST /api/topics/[id]/comments
// Body: { author, text }            → adds top-level comment
// Body: { author, text, replyTo }   → adds reply to comment
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { author, text, replyTo } = await req.json()
  if (!author?.trim() || !text?.trim()) {
    return NextResponse.json({ error: '"author" and "text" required' }, { status: 400 })
  }

  if (replyTo) {
    const reply = dbAddReply(params.id, replyTo, { author: author.trim(), text: text.trim() })
    if (!reply) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    return NextResponse.json(reply, { status: 201 })
  }

  const comment = dbAddComment(params.id, { author: author.trim(), text: text.trim() })
  if (!comment) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
  return NextResponse.json(comment, { status: 201 })
}

// DELETE /api/topics/[id]/comments
// Body: { commentId }
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { commentId } = await req.json()
  if (!commentId) return NextResponse.json({ error: '"commentId" required' }, { status: 400 })
  const deleted = dbDeleteComment(params.id, commentId)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
