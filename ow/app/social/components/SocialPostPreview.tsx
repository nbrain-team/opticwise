'use client';

import { Linkedin, Instagram, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  type: string;
  url: string;
  filename: string;
  preview?: string;
}

interface SocialPostPreviewProps {
  content: string;
  platform: string;
  firstComment?: string | null;
  mediaItems?: MediaItem[] | null;
  accountName?: string | null;
  accountUsername?: string | null;
  accountAvatarUrl?: string | null;
  accountType?: string;
}

export default function SocialPostPreview({
  content,
  platform,
  firstComment,
  mediaItems,
  accountName,
  accountUsername,
  accountAvatarUrl,
  accountType,
}: SocialPostPreviewProps) {
  const isInstagram = platform === 'instagram';
  const displayName = accountName || 'Bill Douglas';
  const username = accountUsername || accountName || 'opticwise';
  const initial = displayName.charAt(0);

  const imageUrl = mediaItems?.[0]?.preview || mediaItems?.[0]?.url;

  if (isInstagram) {
    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            Instagram Preview
          </h3>
        </div>
        <div>
          <div className="flex items-center gap-3 px-4 py-3">
            {accountAvatarUrl ? (
              <img src={accountAvatarUrl} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' }}
              >
                {initial}
              </div>
            )}
            <span className="text-sm font-semibold text-gray-900">{username}</span>
          </div>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className="flex items-center gap-4 px-4 py-2.5 text-gray-900">
            <span className="text-lg">♡</span>
            <span className="text-lg">💬</span>
            <span className="text-lg">📤</span>
            <span className="ml-auto text-lg">🔖</span>
          </div>
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-800 leading-relaxed">
              <span className="font-semibold mr-1">{username}</span>
              {content.length > 200 ? content.slice(0, 200) + '…' : content}
            </p>
            {content.length > 200 && (
              <button className="text-xs text-gray-400 mt-0.5">more</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          LinkedIn Preview
        </h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {accountAvatarUrl ? (
            <img src={accountAvatarUrl} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-semibold text-sm">
              {initial}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
              {accountType === 'company_page' ? 'Company' : displayName} · Just now
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {content.length > 300 ? content.slice(0, 300) + '…' : content}
        </div>
        {content.length > 300 && (
          <button className="text-sm text-gray-500 mt-1 hover:text-gray-700">…see more</button>
        )}
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full h-48 object-cover rounded-lg mt-3" />
        )}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t text-xs text-gray-500">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>🔄 Repost</span>
          <span>📤 Send</span>
        </div>
        {firstComment && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-start gap-2">
              {accountAvatarUrl ? (
                <img src={accountAvatarUrl} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-semibold text-[10px]">
                  {initial}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-gray-700">{displayName}</p>
                <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{firstComment}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
