"use client"

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  messageId?: string
}

interface Session {
  id: string
  title: string
  messageCount?: number
  updatedAt: string
}

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (comment: string, rating?: number) => void
}

function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    
    setIsSubmitting(true)
    await onSubmit(comment, rating || undefined)
    setComment('')
    setRating(null)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add Feedback</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Your feedback helps improve the AI assistant
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How helpful was this response?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg transition-all ${
                    rating && rating >= star
                      ? 'text-amber-400 scale-110'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments or suggestions
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could be improved? Was anything incorrect or missing?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 px-4 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OWnetAgentPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    messageId: string | null
    messageIndex: number
  }>({ isOpen: false, messageId: null, messageIndex: -1 })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        } else if (data.sessions.length === 0) {
          // Auto-create first session if none exist
          await createNewSession()
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
        // Map messages to include messageId
        const mappedMessages = data.messages.map((m: { role: 'user' | 'assistant'; content: string; id?: string }) => ({
          role: m.role,
          content: m.content,
          messageId: m.id,
        }))
        setMessages(mappedMessages)
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
            sources: data.sources,
            messageId: data.messageId,
          }
        ])
        loadSessions() // Refresh session list to update timestamps and titles
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

  const submitFeedback = async (comment: string, rating?: number) => {
    if (!feedbackModal.messageId || !currentSessionId) return

    try {
      const res = await fetch('/api/ownet/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messageId: feedbackModal.messageId,
          comment,
          rating,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Show a brief success indicator
        console.log('Feedback submitted successfully')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const openFeedbackModal = (messageId: string | undefined, messageIndex: number) => {
    if (!messageId) {
      console.error('Message ID not available for feedback')
      return
    }
    setFeedbackModal({
      isOpen: true,
      messageId,
      messageIndex,
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar - Chat History */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#3B6B8F]/5 to-transparent">
          <button
            onClick={createNewSession}
            className="w-full px-4 py-2.5 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-2">
            Chat History
          </div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                currentSessionId === session.id 
                  ? 'bg-[#3B6B8F]/10 border border-[#3B6B8F]/30 shadow-sm' 
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div onClick={() => setCurrentSessionId(session.id)}>
                <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="truncate">{session.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 pl-6">
                  {session.messageCount || 0} messages
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(session.id)
                }}
                className="text-xs text-gray-400 hover:text-red-600 mt-2 pl-6 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              No chat history yet
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-[#50555C]">OWnet Agent</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B6B8F]/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-[#3B6B8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
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
                    : 'bg-white border border-gray-200 shadow-sm'
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
                
                {/* Feedback button for assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => openFeedbackModal(msg.messageId, idx)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#3B6B8F] transition-colors group"
                      title="Add feedback for training"
                    >
                      <span className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-[#3B6B8F]/10 flex items-center justify-center transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Feedback</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, messageId: null, messageIndex: -1 })}
        onSubmit={submitFeedback}
      />
    </div>
  )
}
