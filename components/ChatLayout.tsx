'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'

export default function ChatLayout({ activeId }: { activeId?: string }) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(activeId)

  async function loadConversations() {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setConversations(data)
  }

  useEffect(() => { loadConversations() }, [])

  const selected = conversations.find((c) => c._id === selectedId)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewConversation={loadConversations}
        currentUser={session?.user}
      />
      <main className="flex-1 flex flex-col">
        {selected ? (
          <ChatWindow
            conversation={selected}
            currentUser={session?.user}
            onDeleted={() => { setSelectedId(undefined); loadConversations() }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Select a conversation or start a new one
          </div>
        )}
      </main>
    </div>
  )
}
