'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import NewChatModal from './NewChatModal'
import NewGroupModal from './NewGroupModal'

interface Props {
  conversations: any[]
  selectedId?: string
  onSelect: (id: string) => void
  onNewConversation: () => void
  currentUser: any
}

export default function Sidebar({ conversations, selectedId, onSelect, onNewConversation, currentUser }: Props) {
  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)

  function getConvoName(convo: any) {
    if (convo.isGroup) return convo.name
    const other = convo.members?.find((m: any) => m.email !== currentUser?.email)
    return other?.name || 'Unknown'
  }

  return (
    <aside className="w-72 bg-white border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <span className="font-bold text-lg text-blue-600">ChatApp</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Sign out
        </button>
      </div>

      <div className="p-3 flex gap-2">
        <button
          onClick={() => setShowNewChat(true)}
          className="flex-1 text-sm bg-blue-500 text-white rounded-lg py-1.5 hover:bg-blue-600 transition"
        >
          + New Chat
        </button>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex-1 text-sm bg-green-500 text-white rounded-lg py-1.5 hover:bg-green-600 transition"
        >
          + Group
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">No conversations yet</p>
        )}
        {conversations.map((convo: any) => (
          <button
            key={convo._id}
            onClick={() => onSelect(convo._id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b transition ${
              selectedId === convo._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                {getConvoName(convo)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{getConvoName(convo)}</p>
                {convo.isGroup && (
                  <p className="text-xs text-gray-400">{convo.members?.length} members</p>
                )}
                {convo.lastMessage && (
                  <p className="text-xs text-gray-400 truncate">{convo.lastMessage}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 border-t text-xs text-gray-400 truncate">
        Signed in as {currentUser?.name}
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={(id) => { onNewConversation(); onSelect(id); setShowNewChat(false) }}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreated={(id) => { onNewConversation(); onSelect(id); setShowNewGroup(false) }}
        />
      )}
    </aside>
  )
}
