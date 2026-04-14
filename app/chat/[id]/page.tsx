import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ChatLayout from '@/components/ChatLayout'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { id } = await params
  return <ChatLayout activeId={id} />
}
