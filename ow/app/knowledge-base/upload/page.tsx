'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  'Proposals',
  'Contracts',
  'Technical Docs',
  'Meeting Notes',
  'Research',
  'Marketing',
  'Financial',
  'Training',
  'Policies',
  'Other',
];

type Document = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  comment: string | null;
  category: string | null;
  vectorized: boolean;
  createdAt: string;
  _count: { chunks: number };
};

export default function KnowledgeBaseUploadPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', comment: '', category: '' });

  const [formName, setFormName] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formCategory, setFormCategory] = useState('Other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-base/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      console.error('Error fetching documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress('Uploading and processing...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', formName || file.name.replace(/\.[^.]+$/, ''));
    formData.append('comment', formComment);
    formData.append('category', formCategory);

    try {
      const res = await fetch('/api/knowledge-base/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(`"${data.document.name}" uploaded successfully! ${data.document.chunksCreated} chunks created, ${data.document.totalWords.toLocaleString()} words extracted.`);
      setFormName('');
      setFormComment('');
      setFormCategory('Other');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove the document and all its vectorized chunks.`)) return;
    try {
      await fetch(`/api/knowledge-base/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch {
      alert('Failed to delete document');
    }
  };

  const startEdit = (doc: Document) => {
    setEditingId(doc.id);
    setEditData({ name: doc.name, comment: doc.comment || '', category: doc.category || 'Other' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/knowledge-base/documents/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setEditingId(null);
      fetchDocuments();
    } catch {
      alert('Failed to update document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('html')) return '🌐';
    if (mimeType.includes('csv')) return '📋';
    return '📎';
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C]">Upload Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload files to the AI knowledge base. Documents are automatically processed, chunked, and vectorized for agent search.
          </p>
        </div>
        <Link href="/knowledge-base" className="text-sm text-[#3B6B8F] hover:underline">
          Back to Knowledge Base
        </Link>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2E2E2F]">Upload a Document</h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Auto-detected from filename"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Comment</label>
          <textarea
            value={formComment}
            onChange={e => setFormComment(e.target.value)}
            placeholder="Optional notes about this document..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
          />
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-[#3B6B8F] bg-blue-50' :
            uploading ? 'border-gray-200 bg-gray-50 cursor-wait' :
            'border-gray-300 hover:border-[#3B6B8F] hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6B8F] mx-auto"></div>
              <p className="text-sm text-gray-600">{uploadProgress}</p>
              <p className="text-xs text-gray-400">Extracting text, chunking, and generating embeddings...</p>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Drop a file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, CSV, MD, HTML, XLSX (max 10MB)</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.doc,.txt,.csv,.md,.html,.xlsx"
            className="hidden"
            disabled={uploading}
          />
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#2E2E2F]">
            Uploaded Documents ({documents.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                {editingId === doc.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                        placeholder="Document name"
                      />
                      <select
                        value={editData.category}
                        onChange={e => setEditData({ ...editData, category: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <textarea
                      value={editData.comment}
                      onChange={e => setEditData({ ...editData, comment: e.target.value })}
                      rows={2}
                      placeholder="Notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570]">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{getFileIcon(doc.mimeType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                        {doc.category && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{doc.category}</span>
                        )}
                        {doc.vectorized ? (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Vectorized</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">Processing</span>
                        )}
                      </div>
                      {doc.comment && (
                        <p className="text-xs text-gray-500 mb-1 line-clamp-2">{doc.comment}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{doc._count.chunks} chunks</span>
                        <span>{doc.fileName}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(doc)}
                        className="p-1.5 text-gray-400 hover:text-[#3B6B8F] transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
