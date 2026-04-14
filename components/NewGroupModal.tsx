'use client'
import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

export default function NewGroupModal({ onClose, onCreated }: Props) {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then(setUsers)
  }, [])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function toggleUser(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function createGroup() {
    if (!groupName.trim() || selected.length < 2) return
    setLoading(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGroup: true, name: groupName.trim(), memberIds: selected }),
    })
    const data = await res.json()
    setLoading(false)
    onCreated(data._id)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">New Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <input
          type="text"
          placeholder="Group name"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search users..."
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {selected.map((id) => {
              const u = users.find((x) => x._id === id)
              return (
                <span key={id} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {u?.name}
                  <button onClick={() => toggleUser(id)} className="hover:text-red-500">&times;</button>
                </span>
              )
            })}
          </div>
        )}
        <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
          {filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => toggleUser(u._id)}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition ${
                selected.includes(u._id) ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold text-sm">
                {u.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              {selected.includes(u._id) && <span className="text-green-500 text-lg">✓</span>}
            </button>
          ))}
        </div>
        <button
          onClick={createGroup}
          disabled={loading || !groupName.trim() || selected.length < 2}
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-40 transition text-sm"
        >
          {loading ? 'Creating...' : `Create Group (${selected.length} selected)`}
        </button>
        {selected.length < 2 && (
          <p className="text-xs text-gray-400 text-center mt-2">Select at least 2 members</p>
        )}
      </div>
    </div>
  )
}
