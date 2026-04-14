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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
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

    // Listen for message deletions from others
    socket.on('delete_message', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, deleted: true } : m))
    })

    return () => {
      socket.emit('leave', conversation._id)
      socket.off('message')
      socket.off('delete_message')
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
    const memberIds = conversation.members?.map((m: any) => m._id || m) ?? []
    getSocket().emit('message', {
      conversationId: conversation._id,
      message: msg,
      memberIds,
    })
  }

  async function deleteMessage(messageId: string) {
    const res = await fetch(`/api/messages/${conversation._id}/${messageId}`, { method: 'DELETE' })
    if (res.ok) {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, deleted: true } : m))
      const memberIds = conversation.members?.map((m: any) => m._id || m) ?? []
      getSocket().emit('delete_message', { conversationId: conversation._id, messageId, memberIds })
    }
  }

  async function deleteConversation() {
    const label = conversation.isGroup ? `Delete "${conversation.name}"?` : 'Delete this conversation?'
    if (!confirm(`${label} This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/conversations/${conversation._id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) onDeleted?.()
  }

  const title = conversation.isGroup
    ? conversation.name
    : conversation.members?.find((m: any) => m.email !== currentUser?.email)?.name || 'Chat'

  return (
    <div className="flex flex-col h-full" 
    // style={{backgroundColor: "red"}}
    >
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
        <button
          onClick={deleteConversation}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 border border-red-200 rounded-lg px-3 py-1 transition"
        >
          {deleting ? 'Deleting...' : conversation.isGroup ? 'Delete Group' : 'Delete Chat'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading && <p className="text-center text-gray-400 text-sm">Loading...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm">No messages yet. Say hi!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender?.email === currentUser?.email
          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
              onClick={() => setOpenMenuId(null)}
            >
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && conversation.isGroup && (
                  <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender?.name}</span>
                )}
                <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.deleted ? (
                      <span className="italic opacity-60">This message was deleted</span>
                    ) : (
                      msg.text
                    )}
                  </div>

                  {/* Three dot button — only for own messages that aren't deleted */}
                  {isMe && !msg.deleted && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === msg._id ? null : msg._id)
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      {openMenuId === msg._id && (
                        <div
                          className="absolute right-0 bottom-8 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 w-36"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              deleteMessage(msg._id)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
