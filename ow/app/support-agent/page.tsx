"use client"

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

interface Message {
  role: 'user' | 'assistant'
  content: string
  messageId?: number
  intent?: string
  feedback?: { rating: number }
}

interface Session {
  id: string
  title: string
  messageCount?: number
  status?: string
  customerName?: string
  propertyName?: string
  isVerified?: boolean
  updatedAt: string
}

const QUICK_ACTIONS = [
  { label: 'WiFi not connecting', icon: '📶', message: "My WiFi isn't connecting. Can you help me troubleshoot?" },
  { label: 'Reset my password', icon: '🔑', message: "I need to reset my password for the resident portal." },
  { label: 'Set up a device', icon: '📺', message: "I need help connecting a new device to the network." },
  { label: 'Guest network access', icon: '👥', message: "How do I get access to the guest WiFi network?" },
  { label: 'Internet is slow', icon: '🐌', message: "My internet connection is very slow. What can I do?" },
  { label: 'Report an outage', icon: '⚠️', message: "I think there might be an internet outage in my building." },
]

export default function SupportAgentPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId)
    }
  }, [currentSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/support/sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
        if (data.sessions.length === 0) {
          await createNewSession()
        } else if (!currentSessionId) {
          setCurrentSessionId(data.sessions[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/support/sessions/${sessionId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages.map((m: { role: 'user' | 'assistant'; content: string; id?: number; intent?: string }) => ({
          role: m.role,
          content: m.content,
          messageId: m.id,
          intent: m.intent,
        })))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/support/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
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

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || !currentSessionId || isLoading) return

    setInput('')
    setIsLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: text }])
    const assistantIndex = messages.length + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: currentSessionId }),
      })

      if (!res.ok) throw new Error('Network response was not ok')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullResponse = ''
      let messageId: number | undefined

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'progress') {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[assistantIndex] = {
                      role: 'assistant',
                      content: `*${data.message}*`,
                    }
                    return newMessages
                  })
                } else if (data.type === 'content') {
                  fullResponse += data.text
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[assistantIndex] = {
                      role: 'assistant',
                      content: fullResponse,
                    }
                    return newMessages
                  })
                } else if (data.type === 'complete') {
                  messageId = data.messageId
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[assistantIndex] = {
                      role: 'assistant',
                      content: fullResponse,
                      messageId,
                      intent: data.intent,
                    }
                    return newMessages
                  })
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                  setTimeout(() => loadSessions(), 500)
                } else if (data.type === 'error') {
                  throw new Error(data.details || data.error)
                }
              } catch (parseError) {
                console.error('SSE parse error:', parseError)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[assistantIndex] = {
          role: 'assistant',
          content: "I'm sorry, I ran into an issue processing your request. Please try again, or contact support@opticwise.com for immediate help.",
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this conversation?')) return
    try {
      await fetch(`/api/support/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId)
        setCurrentSessionId(remaining[0]?.id || null)
        if (remaining.length === 0) {
          setMessages([])
          await createNewSession()
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const submitFeedback = async (messageId: number, rating: number) => {
    try {
      await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messageId,
          rating,
          category: rating >= 4 ? 'helpful' : 'not_helpful',
        }),
      })
      setMessages(prev =>
        prev.map(m =>
          m.messageId === messageId ? { ...m, feedback: { rating } } : m
        )
      )
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }

  const showEmptyState = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={createNewSession}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0f766e] to-[#14b8a6] text-white rounded-lg hover:from-[#0d6b63] hover:to-[#0f9e8f] transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-2">
            Conversations
          </div>
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-3 mb-1.5 rounded-lg cursor-pointer transition-all group ${
                currentSessionId === s.id
                  ? 'bg-teal-50 border border-teal-200 shadow-sm'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div onClick={() => setCurrentSessionId(s.id)}>
                <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="truncate">{s.title}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 pl-6">
                  {s.messageCount || 0} messages
                  {s.isVerified && <span className="ml-2 text-green-600">Verified</span>}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                className="text-xs text-gray-300 hover:text-red-500 mt-1.5 pl-6 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">OpticWise Support</h1>
              <p className="text-xs text-gray-500">Tier 1 Customer Service Agent</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {showEmptyState && (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl mb-4 border border-teal-100">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  I&apos;m the OpticWise support assistant. I can help with connectivity issues, account questions, device setup, and more.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.message)}
                    disabled={isLoading}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left group disabled:opacity-50"
                  >
                    <span className="text-xl flex-shrink-0">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gray-800 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 shadow-sm rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <>
                        <div className="prose prose-sm max-w-none
                          [&>h1]:text-gray-900 [&>h1]:font-bold [&>h1]:text-lg [&>h1]:mt-4 [&>h1]:mb-2
                          [&>h2]:text-gray-900 [&>h2]:font-bold [&>h2]:text-base [&>h2]:mt-4 [&>h2]:mb-2
                          [&>h3]:text-gray-900 [&>h3]:font-semibold [&>h3]:text-sm [&>h3]:mt-3 [&>h3]:mb-1.5
                          [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:my-2
                          [&>ul]:my-2 [&>ul]:space-y-1 [&>ul]:ml-4
                          [&>ol]:my-2 [&>ol]:space-y-1 [&>ol]:ml-4
                          [&>li]:text-gray-700 [&>li]:leading-relaxed
                          [&>strong]:text-gray-900 [&>strong]:font-semibold
                          [&>hr]:my-4 [&>hr]:border-gray-200
                          [&>blockquote]:border-l-3 [&>blockquote]:border-teal-400 [&>blockquote]:pl-3 [&>blockquote]:my-3 [&>blockquote]:text-gray-600 [&>blockquote]:italic
                          [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
                        ">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Feedback */}
                        {msg.messageId && !msg.feedback && msg.content && !msg.content.startsWith('*') && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400">Was this helpful?</span>
                            <button
                              onClick={() => submitFeedback(msg.messageId!, 5)}
                              className="p-1 rounded hover:bg-green-50 transition-colors"
                              title="Yes, helpful"
                            >
                              <svg className="w-4 h-4 text-gray-400 hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => submitFeedback(msg.messageId!, 1)}
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                              title="Not helpful"
                            >
                              <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {msg.feedback && (
                          <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
                            <svg className="w-3 h-3 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Feedback received — thank you!
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your issue or ask a question..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none text-sm leading-relaxed"
                  rows={1}
                  disabled={isLoading || !currentSessionId}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !currentSessionId}
                className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-sm flex items-center gap-2"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                <span className="hidden sm:inline">{isLoading ? 'Sending' : 'Send'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
