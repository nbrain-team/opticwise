"use client";

import { useState } from "react";

type GmailMessage = {
  id: string;
  gmailMessageId: string;
  subject: string | null;
  snippet: string | null;
  from: string;
  to: string | null;
  date: string;
  body: string | null;
  attachments: unknown;
};

interface EmailsTabProps {
  entityType: "deal" | "person" | "organization";
  entityId: string;
  emails: GmailMessage[];
}

export function EmailsTab({ entityType, emails }: EmailsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getAttachmentCount = (attachments: unknown): number => {
    if (!attachments) return 0;
    if (Array.isArray(attachments)) return attachments.length;
    return 0;
  };

  const formatEmailAddress = (email: string) => {
    // Extract name and email from "Name <email@domain.com>" format
    const match = email.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: email, email };
  };

  const stripHtml = (html: string | null): string => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <div className="space-y-3">
      {emails.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No emails found for this {entityType}.</p>
          <p className="text-xs text-gray-400 mt-1">Emails are automatically linked when they match contacts in your CRM.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => {
            const isExpanded = expandedId === email.id;
            const fromInfo = formatEmailAddress(email.from);
            const attachmentCount = getAttachmentCount(email.attachments);

            return (
              <div
                key={email.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                {/* Email Header - Always Visible */}
                <button
                  onClick={() => toggleExpand(email.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {fromInfo.name}
                        </span>
                        {attachmentCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {attachmentCount}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-700 truncate mb-1">
                        {email.subject || "(No Subject)"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {email.snippet || stripHtml(email.body)?.substring(0, 100) + "..."}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Email Body - Expandable */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium w-12">From:</span>
                        <span className="text-gray-700">{email.from}</span>
                      </div>
                      {email.to && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 font-medium w-12">To:</span>
                          <span className="text-gray-700">{email.to}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium w-12">Date:</span>
                        <span className="text-gray-700">{new Date(email.date).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {email.body ? (
                        <div
                          className="text-sm text-gray-700 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: email.body }}
                        />
                      ) : (
                        <div className="text-sm text-gray-500 italic">No email body available</div>
                      )}
                    </div>

                    {/* Attachments */}
                    {attachmentCount > 0 && Array.isArray(email.attachments) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Attachments ({attachmentCount})
                        </div>
                        <div className="space-y-1">
                          {(email.attachments as Array<{ filename?: string; name?: string; size?: number }>).map((attachment, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span>{attachment.filename || attachment.name || "Attachment"}</span>
                              {attachment.size && (
                                <span className="text-gray-400">
                                  ({Math.round(attachment.size / 1024)}KB)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
