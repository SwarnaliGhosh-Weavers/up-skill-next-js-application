'use client'
import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

export default function NewChatModal({ onClose, onCreated }: Props) {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then(setUsers)
  }, [])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function startChat(userId: string) {
    setLoading(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, isGroup: false }),
    })
    const data = await res.json()
    setLoading(false)
    onCreated(data._id)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">New Chat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => startChat(u._id)}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-3 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {u.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No users found</p>
          )}
        </div>
      </div>
    </div>
  )
}
