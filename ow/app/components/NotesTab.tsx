"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  content: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

interface NotesTabProps {
  entityType: "deal" | "person" | "organization";
  entityId: string;
  notes: Note[];
}

export function NotesTab({ entityType, entityId, notes: initialNotes }: NotesTabProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteContent,
          [`${entityType}Id`]: entityId,
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setNewNoteContent("");
        setIsAdding(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(notes.map((n) => (n.id === noteId ? updatedNote : n)));
        setEditingId(null);
        setEditContent("");
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes(notes.filter((n) => n.id !== noteId));
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className="space-y-4">
      {/* Add Note Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-md hover:bg-[#2E5570] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </button>
      )}

      {/* Add Note Form */}
      {isAdding && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Enter your note..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddNote}
              disabled={isSubmitting || !newNoteContent.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-md hover:bg-[#2E5570] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Note"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent("");
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAdding ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-sm">No notes yet. Add your first note above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              {editingId === note.id ? (
                // Edit Mode
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditNote(note.id)}
                      disabled={isSubmitting || !editContent.trim()}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6B8F] rounded-md hover:bg-[#2E5570] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs text-gray-500">
                      {note.createdBy && <span className="font-medium">{note.createdBy}</span>}
                      {note.createdBy && " • "}
                      {new Date(note.createdAt).toLocaleString()}
                      {note.updatedAt !== note.createdAt && " (edited)"}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1 text-gray-400 hover:text-[#3B6B8F] transition-colors"
                        title="Edit note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



