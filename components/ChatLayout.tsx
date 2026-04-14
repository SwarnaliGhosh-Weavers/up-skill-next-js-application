'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import { registerUser, getSocket } from '@/lib/socket'

export default function ChatLayout({ activeId }: { activeId?: string }) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(activeId)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Refs to always have latest values inside socket event handlers
  const selectedIdRef = useRef<string | undefined>(activeId)
  const myIdRef = useRef<string | undefined>(undefined)

  // Keep myIdRef in sync with session
  useEffect(() => {
    const userId = (session?.user as any)?.id
    if (!userId) return
    myIdRef.current = userId
    registerUser(userId)
  }, [(session?.user as any)?.id])

  async function loadConversations() {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setConversations(data)
  }

  useEffect(() => { loadConversations() }, [])

  // Listen for new_message events
  useEffect(() => {
    const socket = getSocket()

    socket.on('new_message', ({ conversationId, message }: { conversationId: string; message: any }) => {
      const senderId = message.sender?._id?.toString() || message.sender?.toString()
      if (senderId === myIdRef.current) return

      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
            : c
        )
      )

      if (selectedIdRef.current !== conversationId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }))
      }
    })

    // Handle deleted message notification for users who don't have the chat open
    socket.on('delete_message_notify', ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      // If the conversation is currently open in ChatWindow, ChatWindow handles it via delete_message
      // This handles the case where the conversation is not open — marks message as deleted in memory
      // so when user opens the chat, it will reload fresh from DB anyway
    })

    return () => {
      socket.off('new_message')
      socket.off('delete_message_notify')
    }  }, [])

  function handleSelect(id: string) {
    setSelectedId(id)
    selectedIdRef.current = id
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }))
  }

  const selected = conversations.find((c) => c._id === selectedId)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNewConversation={loadConversations}
        currentUser={session?.user}
        unreadCounts={unreadCounts}
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
