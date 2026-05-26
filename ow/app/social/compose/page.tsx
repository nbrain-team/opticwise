'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import {
  ArrowLeft, Sparkles, Image as ImageIcon, Calendar, Send, Save,
  Linkedin, Instagram, Loader2, X, MessageSquareText, Clock,
  FileText, Wand2, Shield, ChevronDown, Smile,
} from 'lucide-react';
import SocialPostPreview from '../components/SocialPostPreview';
import MentionTypeahead from '../components/MentionTypeahead';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Account {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  platform: 'linkedin' | 'instagram';
  accountType: string;
  isConnected: boolean;
  autoPublishEnabled: boolean;
}

interface MediaItem {
  type: string;
  url: string;
  filename: string;
  preview?: string;
}

interface RiskResult {
  tier: 'low' | 'high';
  reasons: string[];
}

const POST_TYPES = [
  { value: 'Thought Leadership', label: 'Thought Leadership', icon: '💡', desc: 'Share industry insights' },
  { value: 'Educational', label: 'Educational', icon: '📚', desc: 'Teach something valuable' },
  { value: 'Story', label: 'Story / Narrative', icon: '📖', desc: 'Share an experience' },
  { value: 'Industry News', label: 'News Commentary', icon: '📰', desc: 'React to trends' },
  { value: 'Company Update', label: 'Company Update', icon: '🏢', desc: 'Share wins & milestones' },
  { value: 'Engagement', label: 'Engagement', icon: '🔥', desc: 'Drive conversation' },
];

const TONE_OPTIONS = [
  'Professional and insightful',
  'Conversational and warm',
  'Bold and provocative',
  'Inspirational',
  'Data-driven and analytical',
  'Storytelling',
];

const PLATFORM_CONFIG = {
  linkedin: { charLimit: 3000, color: '#0A66C2', label: 'LinkedIn', Icon: Linkedin },
  instagram: { charLimit: 2200, color: '#E1306C', label: 'Instagram', Icon: Instagram },
} as const;

const SUGGESTED_HASHTAGS = [
  '#proptech', '#multifamily', '#smartbuildings', '#realestate',
  '#propertymanagement', '#sustainability', '#IoT', '#NOI',
  '#opticwise', '#buildingtech',
];


export default function ComposePageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">Loading...</div>}>
      <ComposePage />
    </Suspense>
  );
}

function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const editId = searchParams.get('edit');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const [content, setContent] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [showFirstComment, setShowFirstComment] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule' | 'draft'>('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  const [aiTopic, setAiTopic] = useState('');
  const [aiPostType, setAiPostType] = useState('Thought Leadership');
  const [aiTone, setAiTone] = useState('Professional and insightful');
  const [aiContext, setAiContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);

  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [checkingRisk, setCheckingRisk] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const mentionStartRef = useRef<number | null>(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;
  const platform = selectedAccount?.platform ?? 'linkedin';
  const { charLimit, color: platformColor, label: platformLabel, Icon: PlatformIcon } = PLATFORM_CONFIG[platform];
  const isInstagram = platform === 'instagram';

  const charCount = content.length;
  const isOverLimit = charCount > charLimit;
  const hookLength = content.split('\n')[0]?.length || 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    } else {
      setContent(content + emoji);
    }
  };

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/social/accounts');
        const data = await res.json();
        const accts: Account[] = (data.accounts || []).filter((a: Account) => a.isConnected);
        setAccounts(accts);
        if (accts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accts[0].id);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    };
    loadAccounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing post when editing
  useEffect(() => {
    if (!editId) return;
    const loadPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/social/posts/${editId}`);
        if (!res.ok) throw new Error('Failed to load post');
        const data = await res.json();
        const post = data.post || data;
        setContent(post.content || '');
        if (post.firstComment) {
          setFirstComment(post.firstComment);
          setShowFirstComment(true);
        }
        if (post.socialAccountId) setSelectedAccountId(post.socialAccountId);
        if (post.mediaItems?.length) {
          setMediaItems(post.mediaItems.map((m: { type: string; url: string; filename?: string }) => ({
            type: m.type,
            url: m.url,
            filename: m.filename || 'media',
          })));
        }
        if (post.scheduledFor) {
          setScheduleMode('schedule');
          const dt = new Date(post.scheduledFor);
          setScheduledDate(dt.toISOString().split('T')[0]);
          setScheduledTime(dt.toTimeString().slice(0, 5));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [editId]);

  // Risk classification
  const classifyRisk = async (text: string) => {
    if (!text.trim() || text.length < 20) {
      setRisk(null);
      return;
    }
    setCheckingRisk(true);
    try {
      const res = await fetch('/api/social/ai/classify-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setRisk({ tier: data.tier, reasons: data.reasons || [] });
      }
    } catch {
      // Risk check is non-critical
    } finally {
      setCheckingRisk(false);
    }
  };

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/social/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          postType: aiPostType,
          tone: aiTone,
          additionalContext: aiContext,
          existingDraft: content || undefined,
          platform,
          accountType: selectedAccount?.accountType,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setContent(data.content);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
      classifyRisk(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!content.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/social/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Refine this post',
          existingDraft: content,
          additionalContext: 'Make it more compelling. Strengthen the hook, improve flow, and boost engagement potential.',
          platform,
          accountType: selectedAccount?.accountType,
        }),
      });
      if (!res.ok) throw new Error('Refinement failed');
      const data = await res.json();
      setContent(data.content);
      classifyRisk(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI refinement failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/social/media/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload failed');
        }
        const data = await res.json();
        setMediaItems(prev => [...prev, {
          type: data.type,
          url: data.url,
          filename: data.filename,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const insertHashtag = (tag: string) => {
    if (content.includes(tag)) return;
    setContent(prev => (prev ? prev + '\n\n' + tag : tag));
  };

  const handleSave = async () => {
    if (!content.trim()) { setError('Post content is required'); return; }
    if (!selectedAccount) { setError('No account selected'); return; }
    if (isOverLimit) { setError(`Post exceeds ${charLimit.toLocaleString()} character limit`); return; }
    if (isInstagram && mediaItems.length === 0 && scheduleMode === 'now') {
      setError('Instagram posts require at least one image');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        content,
        socialAccountId: selectedAccount.id,
        aiGenerated: generating || !!aiTopic,
        aiPrompt: aiTopic || undefined,
        aiTopicCategory: aiPostType,
      };

      if (!isInstagram && firstComment) body.firstComment = firstComment;
      if (mediaItems.length > 0) {
        body.mediaItems = mediaItems.map(m => ({ type: m.type, url: m.url }));
        body.mediaType = mediaItems[0].type;
      }

      if (scheduleMode === 'now') {
        body.publishNow = true;
      } else if (scheduleMode === 'schedule' && scheduledDate) {
        body.scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
        body.timezone = 'America/Denver';
      }

      const url = editId ? `/api/social/posts/${editId}` : '/api/social/posts';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save post');
      }

      router.push('/social/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    const newContent = e.target.value;
    setContent(newContent);

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newContent.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s@[\](){}\\]*)$/);

    if (atMatch && !isInstagram) {
      const query = atMatch[1];
      mentionStartRef.current = cursorPos - query.length - 1; // position of @
      setMentionQuery(query);
      setMentionVisible(true);

      // Position the dropdown near the cursor
      const textarea = e.target;
      const lineHeight = 22;
      const charsPerLine = Math.floor(textarea.clientWidth / 9);
      const linesBeforeCursor = textBeforeCursor.split('\n').length;
      const lastLineLength = (textBeforeCursor.split('\n').pop() || '').length;
      setMentionPosition({
        top: linesBeforeCursor * lineHeight + 8,
        left: Math.min(lastLineLength * 9, textarea.clientWidth - 288),
      });
    } else {
      if (mentionVisible) {
        setMentionVisible(false);
        mentionStartRef.current = null;
      }
    }
  };

  const handleMentionSelect = (result: { name: string; urn: string; type: string }) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartRef.current === null) return;

    const mentionText = `@[${result.name}](${result.urn})`;
    const before = content.slice(0, mentionStartRef.current);
    const after = content.slice(textarea.selectionStart);
    const newContent = before + mentionText + ' ' + after;
    setContent(newContent);

    setMentionVisible(false);
    setMentionQuery('');
    mentionStartRef.current = null;

    const newCursorPos = before.length + mentionText.length + 1;
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    });
  };

  const handleContentBlur = () => {
    classifyRisk(content);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500 text-sm">Loading post…</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <PlatformIcon className="w-5 h-5" style={{ color: platformColor }} />
            <h1 className="text-xl font-semibold text-gray-900">
              {editId ? 'Edit Post' : 'Compose Post'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Risk badge */}
          {risk && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              risk.tier === 'low'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {risk.tier === 'low' ? 'Low Risk' : 'High Risk'}
            </div>
          )}
          {checkingRisk && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Checking…
            </div>
          )}
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showAiPanel
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border">
            <div className="p-5">
              {/* Account selector dropdown */}
              <div className="mb-4 pb-4 border-b" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                >
                  {selectedAccount ? (
                    <>
                      {selectedAccount.avatarUrl ? (
                        <NextImage
                          src={selectedAccount.avatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: platformColor }}
                        >
                          {(selectedAccount.displayName || selectedAccount.username || 'A').charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {selectedAccount.displayName || selectedAccount.username}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase tracking-wide">
                            {selectedAccount.accountType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {selectedAccount.platform === 'linkedin' ? (
                            <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                          ) : (
                            <Instagram className="w-3 h-3 text-[#E1306C]" />
                          )}
                          Posting to {platformLabel}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Select an account…</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {accountDropdownOpen && accounts.length > 0 && (
                  <div className="absolute z-20 mt-1 w-[calc(100%-2.5rem)] max-w-lg bg-white rounded-xl border border-gray-200 shadow-lg py-1">
                    {accounts.map(acct => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(acct.id);
                          setAccountDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          acct.id === selectedAccountId ? 'bg-gray-50' : ''
                        }`}
                      >
                        {acct.avatarUrl ? (
                          <NextImage
                            src={acct.avatarUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                            style={{ backgroundColor: PLATFORM_CONFIG[acct.platform].color }}
                          >
                            {(acct.displayName || acct.username || 'A').charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {acct.displayName || acct.username}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase tracking-wide">
                              {acct.accountType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {acct.platform === 'linkedin' ? (
                              <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                            ) : (
                              <Instagram className="w-3 h-3 text-[#E1306C]" />
                            )}
                            {PLATFORM_CONFIG[acct.platform].label}
                          </div>
                        </div>
                        {acct.id === selectedAccountId && (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instagram image-required indicator */}
              {isInstagram && mediaItems.length === 0 && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 text-xs font-medium">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image required — Instagram posts must include at least one image
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={content}
                onChange={autoResize}
                onBlur={handleContentBlur}
                placeholder={isInstagram ? 'Write your caption…' : 'What do you want to talk about?'}
                className="w-full min-h-[200px] resize-none border-0 focus:ring-0 text-gray-800 text-[15px] leading-relaxed placeholder:text-gray-400 outline-none"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              />

              {/* Media Previews */}
              {mediaItems.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {mediaItems.map((item, idx) => (
                    <div key={idx} className="relative group">
                      {item.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.preview} alt="" className="w-24 h-24 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-24 h-24 rounded-lg border bg-gray-50 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[10px] text-gray-500 mt-1 truncate w-24">{item.filename}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Character counter & toolbar */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={isInstagram
                      ? 'image/jpeg,image/png,image/gif'
                      : 'image/jpeg,image/png,image/gif,video/mp4,application/pdf'}
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading…' : 'Add Media'}
                  </button>

                  {/* First Comment — LinkedIn only */}
                  {!isInstagram && (
                    <button
                      onClick={() => setShowFirstComment(!showFirstComment)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        showFirstComment ? 'bg-blue-100 text-blue-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      First Comment
                    </button>
                  )}

                  {/* Emoji picker */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        showEmojiPicker ? 'bg-amber-100 text-amber-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <Smile className="w-3.5 h-3.5" />
                      Emoji
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 z-30">
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: { native: string }) => {
                            insertEmoji(emoji.native);
                          }}
                          theme="light"
                          previewPosition="none"
                          skinTonePosition="search"
                          maxFrequentRows={2}
                          perLine={8}
                        />
                      </div>
                    )}
                  </div>

                  {content && (
                    <button
                      onClick={handleRefine}
                      disabled={generating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {generating ? 'Refining…' : 'AI Refine'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {hookLength > 0 && !isInstagram && (
                    <span className={hookLength > 210 ? 'text-amber-600' : 'text-gray-400'}>
                      Hook: {hookLength}/210
                    </span>
                  )}
                  <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'}>
                    {charCount.toLocaleString()}/{charLimit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* First Comment — LinkedIn only */}
          {!isInstagram && showFirstComment && (
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareText className="w-4 h-4 text-[#0A66C2]" />
                <h3 className="text-sm font-medium text-gray-900">First Comment</h3>
                <span className="text-xs text-gray-500">(Best place for links — avoids LinkedIn suppression)</span>
              </div>
              <textarea
                value={firstComment}
                onChange={e => setFirstComment(e.target.value)}
                placeholder="Add a link or additional context as the first comment…"
                className="w-full min-h-[80px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none"
              />
            </div>
          )}

          {/* Hashtag suggestions — Instagram only */}
          {isInstagram && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Suggested Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_HASHTAGS.map(tag => {
                  const active = content.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => insertHashtag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-pink-50 border-pink-300 text-pink-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule & Publish */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Publish Options</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setScheduleMode('draft')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  scheduleMode === 'draft' ? 'bg-gray-100 border-gray-400 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button
                onClick={() => setScheduleMode('schedule')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  scheduleMode === 'schedule'
                    ? `bg-opacity-10 border-current`
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                style={scheduleMode === 'schedule' ? { color: platformColor, borderColor: platformColor, backgroundColor: `${platformColor}10` } : undefined}
              >
                <Calendar className="w-4 h-4" /> Schedule
              </button>
              <button
                onClick={() => setScheduleMode('now')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  scheduleMode === 'now' ? 'bg-green-50 border-green-600 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Send className="w-4 h-4" /> Publish Now
              </button>
            </div>

            {scheduleMode === 'schedule' && (
              <div
                className="flex items-center gap-3 mb-4 p-3 rounded-lg border"
                style={{ backgroundColor: `${platformColor}08`, borderColor: `${platformColor}30` }}
              >
                <Clock className="w-5 h-5" style={{ color: platformColor }} />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                    style={{ borderColor: `${platformColor}40` }}
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                    style={{ borderColor: `${platformColor}40` }}
                  />
                  <span className="text-xs" style={{ color: platformColor }}>MT (America/Denver)</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !content.trim() || isOverLimit || !selectedAccount}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                scheduleMode === 'now'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : scheduleMode === 'schedule'
                  ? 'text-white'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}
              style={scheduleMode === 'schedule' ? { backgroundColor: platformColor } : undefined}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : scheduleMode === 'now' ? (
                <Send className="w-4 h-4" />
              ) : scheduleMode === 'schedule' ? (
                <Calendar className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? 'Saving…'
                : scheduleMode === 'now'
                ? 'Publish Now'
                : scheduleMode === 'schedule'
                ? 'Schedule Post'
                : 'Save as Draft'}
            </button>
          </div>
        </div>

        {/* AI Assistant Panel — 1/3 */}
        {showAiPanel && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border sticky top-20">
              <div className="p-5 border-b">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="font-semibold text-gray-900">AI Writing Assistant</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Generate {platformLabel} posts in Bill&apos;s voice for Opticwise
                </p>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Topic or Idea</label>
                  <textarea
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g., How smart building tech reduces NOI for multifamily…"
                    className="w-full min-h-[80px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Post Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {POST_TYPES.map(pt => (
                      <button
                        key={pt.value}
                        onClick={() => setAiPostType(pt.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          aiPostType === pt.value
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{pt.icon}</span>
                        <span className="truncate">{pt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tone</label>
                  <select
                    value={aiTone}
                    onChange={e => setAiTone(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                  >
                    {TONE_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Additional Context (optional)</label>
                  <textarea
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    placeholder="Any specific points, data, or angle to include…"
                    className="w-full min-h-[60px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !aiTopic.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generating ? 'Generating…' : content ? 'Regenerate Post' : 'Generate Post'}
                </button>
              </div>
            </div>

            {/* Platform-aware preview */}
            {content && (
              <SocialPostPreview
                content={content}
                platform={platform}
                firstComment={firstComment || null}
                mediaItems={mediaItems}
                accountName={selectedAccount?.displayName}
                accountUsername={selectedAccount?.username}
                accountAvatarUrl={selectedAccount?.avatarUrl}
                accountType={selectedAccount?.accountType}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
