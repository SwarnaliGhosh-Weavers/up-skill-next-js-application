'use client'
import { useState, useEffect, useRef } from 'react'
import MessageInput from './MessageInput'
import { getSocket } from '@/lib/socket'

interface Props {
  conversation: any
  currentUser: any
  onDeleted?: () => void
}

export default function ChatWindow({ conversation, currentUser, onDeleted }: Props) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load existing messages from DB
  async function loadMessages() {
    const res = await fetch(`/api/messages/${conversation._id}`)
    const data = await res.json()
    setMessages(data)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    loadMessages()

    const socket = getSocket()

    // Join this conversation's room
    socket.emit('join', conversation._id)

    // Listen for incoming messages from others
    socket.on('message', (msg: any) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.emit('leave', conversation._id)
      socket.off('message')
    }
  }, [conversation._id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    const res = await fetch(`/api/messages/${conversation._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return

    const msg = await res.json()
    // Add to own UI immediately
    setMessages((prev) => [...prev, msg])
    // Broadcast to others in the room
    getSocket().emit('message', { conversationId: conversation._id, message: msg })
  }

  async function deleteGroup() {
    if (!confirm(`Delete "${conversation.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/conversations/${conversation._id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) onDeleted?.()
  }

  const title = conversation.isGroup
    ? conversation.name
    : conversation.members?.find((m: any) => m.email !== currentUser?.email)?.name || 'Chat'

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">
          {title[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{title}</p>
          {conversation.isGroup && (
            <p className="text-xs text-gray-400">
              {conversation.members?.map((m: any) => m.name).join(', ')}
            </p>
          )}
        </div>
        {conversation.isGroup && (
          <button
            onClick={deleteGroup}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 border border-red-200 rounded-lg px-3 py-1 transition"
          >
            {deleting ? 'Deleting...' : 'Delete Group'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading && <p className="text-center text-gray-400 text-sm">Loading...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm">No messages yet. Say hi!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender?.email === currentUser?.email
          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && conversation.isGroup && (
                  <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender?.name}</span>
                )}
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 mx-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendMessage} />
    </div>
  )
}
