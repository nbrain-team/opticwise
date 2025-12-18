"use client";

import { useEffect, useState } from "react";

interface DriveTypeStat {
  mimeType: string;
  total: number;
  vectorized: number;
  isVectorizable: boolean;
  displayName: string;
}

interface Stats {
  drive: {
    byType: DriveTypeStat[];
    vectorizable: { total: number; vectorized: number };
    lastSync: string;
  };
  emails: { total: number; vectorized: number };
  transcripts: { total: number; vectorized: number };
  calendar: { total: number; vectorized: number };
  webPages: { total: number; vectorized: number };
}

export default function KnowledgeBasePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/knowledge-base/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, []);

  const getProgressPercent = (vectorized: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((vectorized / total) * 100);
  };

  const getStatusBadge = (vectorized: number, total: number) => {
    const percent = getProgressPercent(vectorized, total);
    if (total === 0) return { text: "No Data", color: "bg-gray-100 text-gray-600" };
    if (percent === 100) return { text: "Complete", color: "bg-emerald-100 text-emerald-700" };
    if (percent > 0) return { text: "In Progress", color: "bg-amber-100 text-amber-700" };
    return { text: "Pending", color: "bg-gray-100 text-gray-600" };
  };

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI Knowledge Base
        </h1>
        <p className="text-gray-600">
          Data sources powering OWnet Agent&apos;s intelligence. Vectorized content enables semantic search and AI-powered insights.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-10">
        {/* Website Pages Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(stats?.webPages?.vectorized || 0, stats?.webPages?.total || 0).color}`}>
              {getStatusBadge(stats?.webPages?.vectorized || 0, stats?.webPages?.total || 0).text}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Website Pages</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.webPages?.vectorized?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">of {stats?.webPages?.total?.toLocaleString() || 0} vectorized</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 rounded-full transition-all" 
              style={{ width: `${getProgressPercent(stats?.webPages?.vectorized || 0, stats?.webPages?.total || 0)}%` }}
            />
          </div>
        </div>

        {/* Emails Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(stats?.emails.vectorized || 0, stats?.emails.total || 0).color}`}>
              {getStatusBadge(stats?.emails.vectorized || 0, stats?.emails.total || 0).text}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Emails</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.emails.vectorized.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">of {stats?.emails.total.toLocaleString() || 0} vectorized</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all" 
              style={{ width: `${getProgressPercent(stats?.emails.vectorized || 0, stats?.emails.total || 0)}%` }}
            />
          </div>
        </div>

        {/* Transcripts Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(stats?.transcripts.vectorized || 0, stats?.transcripts.total || 0).color}`}>
              {getStatusBadge(stats?.transcripts.vectorized || 0, stats?.transcripts.total || 0).text}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Call Transcripts</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.transcripts.vectorized.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">of {stats?.transcripts.total.toLocaleString() || 0} vectorized</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all" 
              style={{ width: `${getProgressPercent(stats?.transcripts.vectorized || 0, stats?.transcripts.total || 0)}%` }}
            />
          </div>
        </div>

        {/* Drive Files Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(stats?.drive.vectorizable.vectorized || 0, stats?.drive.vectorizable.total || 0).color}`}>
              {getStatusBadge(stats?.drive.vectorizable.vectorized || 0, stats?.drive.vectorizable.total || 0).text}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Drive Documents</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.drive.vectorizable.vectorized.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">of {stats?.drive.vectorizable.total.toLocaleString() || 0} vectorized</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all" 
              style={{ width: `${getProgressPercent(stats?.drive.vectorizable.vectorized || 0, stats?.drive.vectorizable.total || 0)}%` }}
            />
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(stats?.calendar.vectorized || 0, stats?.calendar.total || 0).color}`}>
              {getStatusBadge(stats?.calendar.vectorized || 0, stats?.calendar.total || 0).text}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Calendar Events</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.calendar.vectorized.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">of {stats?.calendar.total.toLocaleString() || 0} vectorized</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all" 
              style={{ width: `${getProgressPercent(stats?.calendar.vectorized || 0, stats?.calendar.total || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Drive Files Detail */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Google Drive Files by Type</h2>
          <p className="text-sm text-gray-500 mt-1">Files from Bill&apos;s Google Drive synced for AI search</p>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Vectorizable Section */}
          <div className="px-6 py-3 bg-emerald-50/50">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">✓ Vectorizable (Text Extractable)</span>
          </div>
          {stats?.drive.byType
            .filter((t) => t.isVectorizable)
            .map((type) => (
              <div key={type.mimeType} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileIcon mimeType={type.mimeType} />
                  <div>
                    <p className="font-medium text-gray-900">{type.displayName}</p>
                    <p className="text-sm text-gray-500">{type.mimeType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{type.vectorized} / {type.total}</p>
                    <p className="text-sm text-gray-500">vectorized</p>
                  </div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${getProgressPercent(type.vectorized, type.total)}%` }}
                    />
                  </div>
                  <span className={`w-16 text-center px-2 py-1 text-xs font-medium rounded-full ${
                    type.vectorized === type.total && type.total > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : type.vectorized > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {getProgressPercent(type.vectorized, type.total)}%
                  </span>
                </div>
              </div>
            ))}

          {/* Non-Vectorizable Section */}
          <div className="px-6 py-3 bg-gray-100/50">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">○ Non-Vectorizable (Images, Videos, etc.)</span>
          </div>
          {stats?.drive.byType
            .filter((t) => !t.isVectorizable)
            .slice(0, 10)
            .map((type) => (
              <div key={type.mimeType} className="px-6 py-3 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <FileIcon mimeType={type.mimeType} />
                  <div>
                    <p className="font-medium text-gray-700">{type.displayName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-600">{type.total} files</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Data Sources Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-6 border border-cyan-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-cyan-900">Website Pages</h3>
          </div>
          <p className="text-sm text-cyan-800 mb-3">
            Pages scraped from opticwise.com sitemap. Full content vectorized for AI-powered search.
          </p>
          <ul className="text-sm text-cyan-700 space-y-1">
            <li>• Blog posts & articles</li>
            <li>• Service pages</li>
            <li>• Company information</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Gmail Integration</h3>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            Emails synced from bill@opticwise.com. Full message content vectorized for semantic search.
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Subject, body, and metadata</li>
            <li>• Auto-linked to contacts</li>
            <li>• Thread context preserved</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-purple-900">Fathom Transcripts</h3>
          </div>
          <p className="text-sm text-purple-800 mb-3">
            AI meeting transcripts from Fathom.ai. Full conversation text with speaker attribution.
          </p>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Complete call transcripts</li>
            <li>• AI summaries included</li>
            <li>• Speaker identification</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-900">Google Drive</h3>
          </div>
          <p className="text-sm text-emerald-800 mb-3">
            Documents from Bill&apos;s Drive. Text extracted from PDFs, Docs, and Office files.
          </p>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• PDFs, Google Docs, Word</li>
            <li>• Text & Markdown files</li>
            <li>• CSV data files</li>
          </ul>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-10 text-center text-sm text-gray-500">
        <p>Vectorization uses OpenAI text-embedding-3-large (1024 dimensions) for semantic search.</p>
        <p className="mt-1">Data is stored in PostgreSQL with pgvector for efficient similarity search.</p>
      </div>
    </div>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("pdf")) {
    return (
      <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
        <span className="text-xs font-bold text-red-600">PDF</span>
      </div>
    );
  }
  if (mimeType.includes("document") || mimeType.includes("wordprocessing")) {
    return (
      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return (
      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  if (mimeType.includes("image")) {
    return (
      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  if (mimeType.includes("folder")) {
    return (
      <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      </div>
    );
  }
  if (mimeType.includes("text") || mimeType.includes("markdown") || mimeType.includes("csv")) {
    return (
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

