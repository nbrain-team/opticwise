import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

async function triggerSync() {
  'use server';
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sales-inbox/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursBack: 24 }),
    });
    
    if (!response.ok) {
      console.error('Sync failed:', await response.text());
    }
  } catch (error) {
    console.error('Error triggering sync:', error);
  }
}

export default async function SalesInboxPage() {
  // Get email threads with messages, sorted by most recent activity
  const threads = await prisma.emailThread.findMany({
    include: { 
      messages: {
        orderBy: { sentAt: 'desc' },
      },
      deal: true, 
      person: {
        include: {
          organization: true,
        },
      },
      organization: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  
  const selected = threads[0] ?? null;
  
  // Count total messages
  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header with sync button */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Inbox</h1>
          <p className="text-sm text-gray-600 mt-1">
            {threads.length} conversations • {totalMessages} messages
          </p>
        </div>
        <form action={triggerSync}>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Sync Now
          </button>
        </form>
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
              <form action={triggerSync}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Sync Emails
                </button>
              </form>
            </div>
          ) : (
            <ul>
              {threads.map((t) => {
                const lastMessage = t.messages[0];
                
                return (
                  <li 
                    key={t.id} 
                    className="border-b bg-white hover:bg-blue-50 transition-colors"
                  >
                    <Link href={`/sales-inbox?thread=${t.id}`} className="block p-4">
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        
        {/* Message Detail */}
        <main className="col-span-2 flex flex-col overflow-hidden bg-white">
          {!selected ? (
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
                      {selected.subject || '(No Subject)'}
                    </h2>
                    
                    <div className="flex items-center gap-4 text-sm">
                      {selected.person && (
                        <Link 
                          href={`/person/${selected.personId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {selected.person.firstName} {selected.person.lastName}
                        </Link>
                      )}
                      
                      {selected.organization && (
                        <Link 
                          href={`/organization/${selected.organizationId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selected.organization.name}
                        </Link>
                      )}
                      
                      {selected.person?.email && (
                        <span className="text-gray-600">
                          {selected.person.email}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selected.deal ? (
                    <Link
                      href={`/deal/${selected.dealId}`}
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
                {selected.messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages in this thread
                  </div>
                ) : (
                  selected.messages.map((m) => (
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
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Reply
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
