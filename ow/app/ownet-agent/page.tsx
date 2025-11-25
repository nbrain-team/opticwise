"use client"

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

interface Session {
  id: string
  title: string
  messageCount?: number
  updatedAt: string
}

export default function OWnetAgentPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId)
    }
  }, [currentSessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/ownet/sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
        if (!currentSessionId && data.sessions.length > 0) {
          setCurrentSessionId(data.sessions[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/ownet/sessions/${sessionId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/ownet/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => [data.session, ...prev])
        setCurrentSessionId(data.session.id)
        setMessages([])
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentSessionId || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await fetch('/api/ownet/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: data.response,
            sources: data.sources 
          }
        ])
        loadSessions() // Refresh session list to update timestamps
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
        ])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this chat?')) return

    try {
      await fetch(`/api/ownet/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions[0]?.id || null)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewSession}
            className="w-full px-4 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
          >
            + New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                currentSessionId === session.id ? 'bg-blue-50 border border-[#3B6B8F]' : 'border border-transparent'
              }`}
            >
              <div onClick={() => setCurrentSessionId(session.id)}>
                <div className="font-medium text-sm text-gray-900 truncate">
                  {session.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {session.messageCount || 0} messages
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(session.id)
                }}
                className="text-xs text-red-600 hover:text-red-800 mt-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-[#50555C]">🧠 OWnet Agent</h1>
          <p className="text-sm text-gray-600 mt-1">
            AI assistant powered by 142 sales call transcripts
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg mb-2">Ask me anything about Opticwise!</p>
              <p className="text-sm">
                I can search through call transcripts, find client information, and help with your CRM.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-[#3B6B8F] text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Sources: {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-pulse">●</div>
                  <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</div>
                  <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</div>
                  <span className="ml-2 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about transcripts, deals, or anything else..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              disabled={isLoading || !currentSessionId}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !currentSessionId}
              className="px-6 py-3 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
          
          {!currentSessionId && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Create a new chat to get started
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

