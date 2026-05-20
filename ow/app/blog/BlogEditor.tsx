"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { useRef } from "react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"

interface BlogEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded-lg my-4" } }),
      Placeholder.configure({ placeholder: "Write your article content here…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-gray max-w-none min-h-[400px] px-4 py-3 focus:outline-none text-sm leading-relaxed",
      },
    },
  })

  if (!editor) return null

  const toolbarBtn = (
    active: boolean,
    title: string,
    onClick: () => void,
    children: React.ReactNode
  ) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors text-sm ${
        active ? "bg-[#123b6d] text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  )

  function addLink() {
    const url = window.prompt("URL:")
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  async function handleImageFile(file: File) {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/blog/upload-image", { method: "POST", body: fd })
    if (!res.ok) {
      const data = await res.json()
      alert("Image upload failed: " + (data.error || res.statusText))
      return
    }
    const { url } = await res.json()
    editor.chain().focus().setImage({ src: url }).run()
  }

  function triggerImageUpload() {
    imageInputRef.current?.click()
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageFile(file)
          e.target.value = ""
        }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">
        {toolbarBtn(editor.isActive("bold"), "Bold", () => editor.chain().focus().toggleBold().run(), <strong>B</strong>)}
        {toolbarBtn(editor.isActive("italic"), "Italic", () => editor.chain().focus().toggleItalic().run(), <em>I</em>)}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {toolbarBtn(
          editor.isActive("heading", { level: 2 }),
          "H2",
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          <span className="font-bold text-xs">H2</span>
        )}
        {toolbarBtn(
          editor.isActive("heading", { level: 3 }),
          "H3",
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          <span className="font-bold text-xs">H3</span>
        )}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {toolbarBtn(
          editor.isActive("bulletList"),
          "Bullet list",
          () => editor.chain().focus().toggleBulletList().run(),
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )}
        {toolbarBtn(
          editor.isActive("orderedList"),
          "Ordered list",
          () => editor.chain().focus().toggleOrderedList().run(),
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {toolbarBtn(
          editor.isActive("blockquote"),
          "Blockquote",
          () => editor.chain().focus().toggleBlockquote().run(),
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {toolbarBtn(
          editor.isActive("link"),
          "Link",
          addLink,
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
        {/* Image upload button */}
        <button
          type="button"
          title="Upload image"
          onClick={triggerImageUpload}
          className="p-1.5 rounded transition-colors text-sm text-gray-600 hover:bg-gray-100 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Upload</span>
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {toolbarBtn(
          false,
          "Horizontal rule",
          () => editor.chain().focus().setHorizontalRule().run(),
          <span className="text-xs font-mono">—</span>
        )}
        {toolbarBtn(
          false,
          "Undo",
          () => editor.chain().focus().undo().run(),
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )}
        {toolbarBtn(
          false,
          "Redo",
          () => editor.chain().focus().redo().run(),
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
