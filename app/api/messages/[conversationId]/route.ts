import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import Conversation from '@/lib/models/Conversation'
import User from '@/lib/models/User'

// app/api/messages/[conversationId]/route.ts

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await params
  await connectDB()
  const messages = await Message.find({ conversationId })
    .populate('sender', 'name email')
    .sort({ createdAt: 1 })
  return NextResponse.json(messages)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  await connectDB()
  const me = await User.findOne({ email: session.user?.email })
  const message = await Message.create({ conversationId, sender: me._id, text: text.trim() })
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text.trim(),
    lastMessageAt: new Date(),
  })
  const populated = await message.populate('sender', 'name email')
  return NextResponse.json(populated)
}
