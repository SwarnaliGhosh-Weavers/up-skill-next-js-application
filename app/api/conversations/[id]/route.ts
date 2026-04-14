/**
 * API: DELETE /api/conversations/[id]
 * Purpose: Delete a conversation (single chat or group) and all its messages.
 * - Only a member of the conversation can delete it
 * - Deletes all associated messages from the Message collection
 * - Requires authentication
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()

  const me = await User.findOne({ email: session.user?.email })
  const convo = await Conversation.findById(id)

  if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isMember = convo.members.some((m: any) => m.toString() === me._id.toString())
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await Message.deleteMany({ conversationId: id })
  await Conversation.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}
