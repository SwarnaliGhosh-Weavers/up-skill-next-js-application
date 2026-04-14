'use client'
import { useState, useRef } from 'react'
import { getSocket } from '@/lib/socket'

interface Props {
  onSend: (text: string) => void
  conversationId: string
  userName: string
}

export default function MessageInput({ onSend, conversationId, userName }: Props) {
  const [text, setText] = useState('')
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value)

    // Emit typing start
    getSocket().emit('typing', { conversationId, userName, isTyping: true })

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    // Emit typing stop after 1.5s of no input
    typingTimeoutRef.current = setTimeout(() => {
      getSocket().emit('typing', { conversationId, userName, isTyping: false })
    }, 1500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    // Stop typing indicator on send
    getSocket().emit('typing', { conversationId, userName, isTyping: false })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onSend(text.trim())
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t px-4 py-3 flex gap-3 items-center">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e as any) }}
        placeholder="Type a message..."
        className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="bg-blue-500 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 transition"
        aria-label="Send"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  )
}
