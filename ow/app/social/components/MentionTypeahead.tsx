'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, User, Building2, Linkedin, AlertCircle } from 'lucide-react';

interface MentionResult {
  name: string;
  urn: string;
  type: 'person' | 'organization';
  headline?: string;
  avatarUrl?: string;
  source: 'linkedin' | 'crm';
  resolved?: boolean;
}

interface MentionTypeaheadProps {
  query: string;
  accountId: string | null;
  visible: boolean;
  position: { top: number; left: number };
  onSelect: (result: MentionResult) => void;
  onClose: () => void;
}

export default function MentionTypeahead({
  query,
  accountId,
  visible,
  position,
  onSelect,
  onClose,
}: MentionTypeaheadProps) {
  const [results, setResults] = useState<MentionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (accountId) params.set('accountId', accountId);
      const res = await fetch(`/api/social/mentions/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error('Mention search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!visible || !query) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible, fetchResults]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        onSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, results, selectedIndex, onSelect, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-72 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {loading && results.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching…
        </div>
      )}
      {!loading && results.length === 0 && query.length >= 2 && (
        <div className="px-4 py-3 text-sm text-gray-400">
          No matches found
        </div>
      )}
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto py-1">
          {results.map((result, idx) => (
            <button
              key={`${result.urn}-${idx}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(result);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                idx === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {result.avatarUrl ? (
                  <img src={result.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                ) : result.type === 'organization' ? (
                  <Building2 className="w-4 h-4 text-gray-500" />
                ) : (
                  <User className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                {result.headline && (
                  <p className="text-xs text-gray-500 truncate">{result.headline}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {result.resolved === false && (
                  <span title="May not link — connect Company Page for full mentions">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                  </span>
                )}
                {result.source === 'linkedin' && (
                  <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                )}
                <span className="text-[10px] text-gray-400 uppercase">
                  {result.source === 'crm' ? 'CRM' : 'LI'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {results.length > 0 && results.some(r => r.resolved === false) && (
        <div className="px-3 py-1.5 border-t bg-amber-50 text-[10px] text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          Connect a Company Page on /social for clickable mentions
        </div>
      )}
      <div className="px-3 py-1.5 border-t bg-gray-50 text-[10px] text-gray-400">
        ↑↓ navigate · Enter select · Esc close
      </div>
    </div>
  );
}
