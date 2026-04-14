/**
 * API: GET /api/conversations
 * Purpose: Fetch all conversations the logged-in user is a member of.
 * - Sorted by most recent message (lastMessageAt)
 * - Populates member details (name, email)
 *
 * API: POST /api/conversations
 * Purpose: Create a new conversation — either single chat or group chat.
 * - Single chat: Reuses existing conversation if one already exists between the two users
 * - Group chat: Creates a new group with a name and multiple members
 * - Requires authentication
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Conversation from '@/lib/models/Conversation'
import User from '@/lib/models/User'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const me = await User.findOne({ email: session.user?.email })
  const convos = await Conversation.find({ members: me._id })
    .populate('members', 'name email')
    .sort({ lastMessageAt: -1 })
  return NextResponse.json(convos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId, isGroup, name, memberIds } = await req.json()
  await connectDB()
  const me = await User.findOne({ email: session.user?.email })

  if (isGroup) {
    const members = [me._id, ...memberIds]
    const convo = await Conversation.create({ name, isGroup: true, members })
    const populated = await convo.populate('members', 'name email')
    return NextResponse.json(populated)
  }

  const existing = await Conversation.findOne({
    isGroup: false,
    members: { $all: [me._id, targetUserId], $size: 2 },
  }).populate('members', 'name email')
  if (existing) return NextResponse.json(existing)

  const convo = await Conversation.create({ isGroup: false, members: [me._id, targetUserId] })
  const populated = await convo.populate('members', 'name email')
  return NextResponse.json(populated)
}
