'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type EmailMessage = {
  id: string;
  sender: string;
  recipients: string;
  cc: string | null;
  body: string;
  direction: 'INCOMING' | 'OUTGOING';
  sentAt: Date;
};

type EmailThread = {
  id: string;
  subject: string;
  updatedAt: Date;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    organization: {
      id: string;
      name: string;
    } | null;
  } | null;
  organization: {
    id: string;
    name: string;
  } | null;
  deal: {
    id: string;
    title: string;
  } | null;
  dealId: string | null;
  personId: string | null;
  organizationId: string | null;
  messages: EmailMessage[];
};

export default function SalesInboxPage() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [replyMode, setReplyMode] = useState<'none' | 'ai' | 'manual'>('none');
  const [aiReply, setAiReply] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [manualReply, setManualReply] = useState('');

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/sales-inbox/threads');
      const data = await response.json();
      setThreads(data.threads || []);
      if (data.threads && data.threads.length > 0) {
        setSelectedThread(data.threads[0]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sales-inbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursBack: 24 }),
      });
      if (response.ok) {
        await fetchThreads();
      }
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleAIReply = async () => {
    if (!selectedThread) return;
    
    setGeneratingAI(true);
    setReplyMode('ai');
    setAiReply('');
    
    try {
      const response = await fetch('/api/sales-inbox/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread.id }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAiReply(data.reply);
      } else {
        alert('Failed to generate AI reply: ' + (data.error || 'Unknown error'));
        setReplyMode('none');
      }
    } catch (error) {
      console.error('Error generating AI reply:', error);
      alert('Failed to generate AI reply');
      setReplyMode('none');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleManualReply = () => {
    setReplyMode('manual');
    setManualReply('');
  };

  const handleCancelReply = () => {
    setReplyMode('none');
    setAiReply('');
    setManualReply('');
  };

  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Inbox</h1>
          <p className="text-sm text-gray-600 mt-1">
            {threads.length} conversations • {totalMessages} messages
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-3 overflow-hidden">
        {/* Thread List */}
        <aside className="border-r overflow-y-auto bg-gray-50">
          {threads.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-4">No email threads yet.</p>
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Sync Emails
              </button>
            </div>
          ) : (
            <ul>
              {threads.map((t) => {
                const lastMessage = t.messages[t.messages.length - 1];
                const isSelected = selectedThread?.id === t.id;

                return (
                  <li
                    key={t.id}
                    className={`border-b bg-white hover:bg-blue-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedThread(t)}
                  >
                    <div className="block p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-sm line-clamp-1 flex-1">
                          {t.subject || '(No Subject)'}
                        </div>
                        {lastMessage && (
                          <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {formatDistanceToNow(new Date(lastMessage.sentAt), { addSuffix: true })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        {t.person && (
                          <span className="font-medium">
                            {t.person.firstName} {t.person.lastName}
                          </span>
                        )}
                        {t.organization && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{t.organization.name}</span>
                          </>
                        )}
                      </div>

                      {lastMessage && (
                        <div className="text-xs text-gray-500 line-clamp-2">
                          {lastMessage.body.replace(/<[^>]*>/g, '').slice(0, 100)}...
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {t.messages.length} {t.messages.length === 1 ? 'message' : 'messages'}
                        </span>
                        {t.deal && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-blue-600 font-medium">
                              Linked to deal
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Message Detail */}
        <main className="col-span-2 flex flex-col overflow-hidden bg-white">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg mb-2">
                      {selectedThread.subject || '(No Subject)'}
                    </h2>

                    <div className="flex items-center gap-4 text-sm">
                      {selectedThread.person && (
                        <Link
                          href={`/person/${selectedThread.personId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {selectedThread.person.firstName} {selectedThread.person.lastName}
                        </Link>
                      )}

                      {selectedThread.organization && (
                        <Link
                          href={`/organization/${selectedThread.organizationId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedThread.organization.name}
                        </Link>
                      )}

                      {selectedThread.person?.email && (
                        <span className="text-gray-600">
                          {selectedThread.person.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedThread.deal ? (
                    <Link
                      href={`/deal/${selectedThread.dealId}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Deal
                    </Link>
                  ) : (
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Create Deal
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedThread.messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages in this thread
                  </div>
                ) : (
                  selectedThread.messages.map((m) => (
                    <article
                      key={m.id}
                      className={`border rounded-lg p-4 ${
                        m.direction === 'OUTGOING'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            m.direction === 'OUTGOING' ? 'bg-blue-600' : 'bg-gray-600'
                          }`}>
                            {m.direction === 'OUTGOING' ? 'Me' : m.sender.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {m.direction === 'OUTGOING' ? 'Me' : m.sender}
                            </div>
                            <div className="text-xs text-gray-600">
                              {m.direction === 'OUTGOING' ? 'Sent' : 'Received'} • {' '}
                              {new Date(m.sentAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {m.cc && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              CC: {m.cc.split(',').length}
                            </span>
                          )}
                        </div>
                      </div>

                      {m.recipients && m.direction === 'OUTGOING' && (
                        <div className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">To:</span> {m.recipients}
                        </div>
                      )}

                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: m.body }}
                      />
                    </article>
                  ))
                )}
              </div>

              {/* Reply Box */}
              <div className="border-t p-4 bg-gray-50">
                {replyMode === 'none' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAIReply}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Reply with AI
                    </button>
                    <button
                      onClick={handleManualReply}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Reply Manually
                    </button>
                  </div>
                )}

                {replyMode === 'ai' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI-Generated Reply (GPT-4o)
                      </div>
                      <button
                        onClick={handleCancelReply}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>

                    {generatingAI ? (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                        Generating AI reply...
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={aiReply}
                          onChange={(e) => setAiReply(e.target.value)}
                          className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={8}
                          placeholder="AI-generated reply will appear here..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // TODO: Implement send functionality
                              alert('Send functionality coming soon!');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Send Reply
                          </button>
                          <button
                            onClick={handleAIReply}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Regenerate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {replyMode === 'manual' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-600">
                        Manual Reply
                      </div>
                      <button
                        onClick={handleCancelReply}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>

                    <textarea
                      value={manualReply}
                      onChange={(e) => setManualReply(e.target.value)}
                      className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                      placeholder="Type your reply here..."
                    />
                    <button
                      onClick={() => {
                        // TODO: Implement send functionality
                        alert('Send functionality coming soon!');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Send Reply
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
