/**
 * API: DELETE /api/messages/[conversationId]/[messageId]
 * Purpose: Delete a single message by its ID.
 * - Only the sender of the message can delete it
 * - Requires authentication
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId } = await params
  await connectDB()

  const me = await User.findOne({ email: session.user?.email })
  const message = await Message.findById(messageId)

  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (message.sender.toString() !== me._id.toString())
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Mark as deleted instead of removing — preserves placeholder for all users
  await Message.findByIdAndUpdate(messageId, { deleted: true })
  return NextResponse.json({ success: true, messageId })
}
