'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import {
  ArrowLeft, Sparkles, Image as ImageIcon, Calendar, Send, Save,
  Linkedin, Loader2, X, MessageSquareText, Clock,
  FileText, Wand2,
} from 'lucide-react';

interface Account {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  zernioAccountId: string;
}

interface MediaItem {
  type: string;
  url: string;
  filename: string;
  preview?: string;
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

export default function ComposePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/linkedin/accounts');
        const data = await res.json();
        const accts = data.accounts || [];
        if (accts.length > 0) {
          setAccounts(accts);
          return;
        }
        const syncRes = await fetch('/api/linkedin/connect', { method: 'POST' });
        const syncData = await syncRes.json();
        if (syncData.accounts?.length > 0) {
          setAccounts(syncData.accounts);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    };
    loadAccounts();
  }, []);

  const charCount = content.length;
  const isOverLimit = charCount > 3000;
  const hookLength = content.split('\n')[0]?.length || 0;

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/linkedin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          postType: aiPostType,
          tone: aiTone,
          additionalContext: aiContext,
          existingDraft: content || undefined,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setContent(data.content);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
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
      const res = await fetch('/api/linkedin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Refine this post',
          existingDraft: content,
          additionalContext: 'Make it more compelling. Strengthen the hook, improve flow, and boost engagement potential.',
        }),
      });
      if (!res.ok) throw new Error('Refinement failed');
      const data = await res.json();
      setContent(data.content);
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
        const res = await fetch('/api/linkedin/media/upload', {
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

  const handleSave = async () => {
    if (!content.trim()) { setError('Post content is required'); return; }
    if (accounts.length === 0) { setError('No LinkedIn account connected'); return; }
    if (isOverLimit) { setError('Post exceeds 3,000 character limit'); return; }

    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        content,
        accountId: accounts[0].id,
        aiGenerated: generating || !!aiTopic,
        aiPrompt: aiTopic || undefined,
        aiTopicCategory: aiPostType,
      };

      if (firstComment) body.firstComment = firstComment;
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

      const res = await fetch('/api/linkedin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save post');
      }

      router.push('/linkedin/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    setContent(e.target.value);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/linkedin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <h1 className="text-xl font-semibold text-gray-900">Compose Post</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Post Editor */}
          <div className="bg-white rounded-xl border">
            <div className="p-5">
              {/* Account selector */}
              {accounts.length > 0 && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  {accounts[0].avatarUrl ? (
                    <NextImage src={accounts[0].avatarUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-full" unoptimized />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-semibold">
                      {(accounts[0].displayName || 'L').charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{accounts[0].displayName || accounts[0].username}</p>
                    <p className="text-xs text-gray-500">Posting to LinkedIn</p>
                  </div>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={content}
                onChange={autoResize}
                placeholder="What do you want to talk about?"
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
                    accept="image/jpeg,image/png,image/gif,video/mp4,application/pdf"
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
                    {uploading ? 'Uploading...' : 'Add Media'}
                  </button>
                  <button
                    onClick={() => setShowFirstComment(!showFirstComment)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showFirstComment ? 'bg-blue-100 text-blue-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    First Comment
                  </button>
                  {content && (
                    <button
                      onClick={handleRefine}
                      disabled={generating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {generating ? 'Refining...' : 'AI Refine'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {hookLength > 0 && (
                    <span className={hookLength > 210 ? 'text-amber-600' : 'text-gray-400'}>
                      Hook: {hookLength}/210
                    </span>
                  )}
                  <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'}>
                    {charCount}/3,000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* First Comment */}
          {showFirstComment && (
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareText className="w-4 h-4 text-[#0A66C2]" />
                <h3 className="text-sm font-medium text-gray-900">First Comment</h3>
                <span className="text-xs text-gray-500">(Best place for links — avoids LinkedIn suppression)</span>
              </div>
              <textarea
                value={firstComment}
                onChange={e => setFirstComment(e.target.value)}
                placeholder="Add a link or additional context as the first comment..."
                className="w-full min-h-[80px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none"
              />
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
                  scheduleMode === 'schedule' ? 'bg-blue-50 border-[#0A66C2] text-[#0A66C2]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
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
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <Clock className="w-5 h-5 text-[#0A66C2]" />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#0A66C2] outline-none"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#0A66C2] outline-none"
                  />
                  <span className="text-xs text-blue-600">MT (America/Denver)</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !content.trim() || isOverLimit || accounts.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                scheduleMode === 'now'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : scheduleMode === 'schedule'
                  ? 'bg-[#0A66C2] hover:bg-[#004182] text-white'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}
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
                ? 'Saving...'
                : scheduleMode === 'now'
                ? 'Publish Now'
                : scheduleMode === 'schedule'
                ? 'Schedule Post'
                : 'Save as Draft'}
            </button>
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAiPanel && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border sticky top-20">
              <div className="p-5 border-b">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="font-semibold text-gray-900">AI Writing Assistant</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">Generate posts in Bill&apos;s voice for Opticwise</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Topic */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Topic or Idea</label>
                  <textarea
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g., How smart building tech reduces NOI for multifamily..."
                    className="w-full min-h-[80px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                  />
                </div>

                {/* Post Type */}
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

                {/* Tone */}
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

                {/* Additional context */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Additional Context (optional)</label>
                  <textarea
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    placeholder="Any specific points, data, or angle to include..."
                    className="w-full min-h-[60px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                  />
                </div>

                {/* Generate Button */}
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
                  {generating ? 'Generating...' : content ? 'Regenerate Post' : 'Generate Post'}
                </button>
              </div>
            </div>

            {/* LinkedIn Preview */}
            {content && (
              <div className="bg-white rounded-xl border">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-900">LinkedIn Preview</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-semibold text-sm">
                      {accounts[0]?.displayName?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{accounts[0]?.displayName || 'Bill Demas'}</p>
                      <p className="text-xs text-gray-500">CEO at Opticwise · Just now</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {content.length > 300 ? content.slice(0, 300) + '...' : content}
                  </div>
                  {content.length > 300 && (
                    <button className="text-sm text-gray-500 mt-1 hover:text-gray-700">...see more</button>
                  )}
                  {mediaItems.length > 0 && mediaItems[0].preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaItems[0].preview} alt="" className="w-full h-48 object-cover rounded-lg mt-3" />
                  )}
                  <div className="flex items-center gap-6 mt-4 pt-3 border-t text-xs text-gray-500">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔄 Repost</span>
                    <span>📤 Send</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
