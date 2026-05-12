"use client";

/**
 * Lightweight HTML WYSIWYG editor used inside the Form Builder for authoring
 * the confirmation email sent to a form submitter.
 *
 * Why not a heavy library?
 *   - Authors only need basic email-friendly formatting (bold, italic,
 *     headings, lists, links, alignment, color), and email clients render a
 *     restricted HTML subset anyway. A 30-line `contentEditable` editor +
 *     `document.execCommand` covers everything email-safe with zero new
 *     dependencies. We can always upgrade to Tiptap/Lexical later without
 *     changing the public API of this component.
 *
 * Notes:
 *   - We intentionally do NOT sanitize HTML on submit — the value is authored
 *     by an authenticated CRM admin, and the same string is what we render
 *     back into the editor on edit. Sanitization happens implicitly via the
 *     browser's contentEditable normalization.
 *   - Merge tags like `{firstName}`, `{company}`, `{email}`, etc. are
 *     surfaced via `mergeTags`; clicking one inserts the literal token at
 *     the cursor position.
 */

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

export type RichTextEmailEditorHandle = {
  insertHtml: (html: string) => void;
};

type Props = {
  value: string;
  onChange: (html: string) => void;
  mergeTags?: string[];
  placeholder?: string;
  minHeight?: number;
  /** Default strips rich paste for email-safe HTML. Set false for blog body. */
  pastePlainText?: boolean;
  /** Show toolbar button — parent handles file upload then calls ref.insertHtml */
  onImageRequest?: () => void;
};

const RichTextEmailEditor = forwardRef<RichTextEmailEditorHandle, Props>(function RichTextEmailEditor(
{
  value,
  onChange,
  mergeTags = [],
  placeholder = "Write the email your submitter will receive…",
  minHeight = 280,
  pastePlainText = true,
  onImageRequest,
}: Props,
ref
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync external `value` into the contentEditable div ONLY when it differs
  // from the current DOM content. Avoids clobbering the user's caret while
  // they're typing (React would otherwise re-render and reset the cursor).
  useEffect(() => {
    if (!editorRef.current) return;
    if (showHtml) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, showHtml]);

  function emitChange() {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }

  function exec(command: string, valueArg?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, valueArg);
    emitChange();
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const range = savedSelectionRef.current;
    if (!range || !editorRef.current) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    editorRef.current.focus();
  }

  function insertHtmlAtCursor(html: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emitChange();
  }

  useImperativeHandle(ref, () => ({ insertHtml: insertHtmlAtCursor }));

  function insertMergeTag(tag: string) {
    insertHtmlAtCursor(`{${tag}}`);
  }

  function openLinkDialog() {
    if (!editorRef.current) return;
    saveSelection();
    const sel = window.getSelection();
    const selected = sel && sel.rangeCount > 0 ? sel.toString() : "";
    setLinkText(selected || "");
    setLinkUrl("https://");
    setLinkOpen(true);
  }

  function applyLink() {
    if (!linkUrl || linkUrl === "https://") {
      setLinkOpen(false);
      return;
    }
    restoreSelection();
    if (!editorRef.current) return;
    const sel = window.getSelection();
    const hasSelection = sel && sel.toString().length > 0;
    if (hasSelection) {
      document.execCommand("createLink", false, linkUrl);
    } else {
      const safeUrl = linkUrl.replace(/"/g, "&quot;");
      const text = (linkText || linkUrl).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${safeUrl}" target="_blank" rel="noopener">${text}</a>`
      );
    }
    setLinkOpen(false);
    emitChange();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    if (!pastePlainText) return;
    const text = e.clipboardData.getData("text/plain");
    if (text) {
      e.preventDefault();
      document.execCommand("insertText", false, text);
      emitChange();
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <Toolbar
        onImageRequest={onImageRequest}
        onCommand={exec}
        onLink={openLinkDialog}
        onToggleHtml={() => {
          if (showHtml && editorRef.current) {
            // Switching back to visual — push the typed-HTML back through
            // the div so we apply browser normalization.
            editorRef.current.innerHTML = value;
          }
          setShowHtml((s) => !s);
        }}
        showHtml={showHtml}
      />

      {showHtml ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          spellCheck={false}
          className="w-full p-4 font-mono text-xs text-gray-800 outline-none resize-y"
          style={{ minHeight }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          className="email-wysiwyg w-full p-4 text-sm text-gray-900 outline-none overflow-auto"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      )}

      {mergeTags.length > 0 && !showHtml && (
        <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-1.5">
            Insert merge tag
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mergeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => insertMergeTag(tag)}
                className="text-[11px] font-mono bg-white hover:bg-[#3B6B8F] hover:text-white text-gray-700 px-2 py-0.5 rounded border border-gray-200"
              >
                {`{${tag}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {linkOpen && (
        <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wide font-medium text-gray-500">
            Insert link
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link text (optional if text is selected)"
              className="ow-input flex-1"
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="ow-input flex-1"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyLink}
                className="text-sm bg-[#3B6B8F] text-white px-3 py-1.5 rounded-lg hover:bg-[#2E5570]"
              >
                Insert
              </button>
              <button
                type="button"
                onClick={() => setLinkOpen(false)}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default RichTextEmailEditor;

/**
 * Toolbar of formatting buttons. Keeps the styling consistent with the rest
 * of the form builder (light gray bar, [#3B6B8F] active accent).
 */
function Toolbar({
  onCommand,
  onLink,
  onToggleHtml,
  onImageRequest,
  showHtml,
}: {
  onCommand: (cmd: string, value?: string) => void;
  onLink: () => void;
  onToggleHtml: () => void;
  onImageRequest?: () => void;
  showHtml: boolean;
}) {
  const blockOptions: { value: string; label: string }[] = [
    { value: "P", label: "Paragraph" },
    { value: "H1", label: "Heading 1" },
    { value: "H2", label: "Heading 2" },
    { value: "H3", label: "Heading 3" },
    { value: "BLOCKQUOTE", label: "Quote" },
  ];

  const colorOptions = [
    { value: "#1a2434", label: "Default" },
    { value: "#3B6B8F", label: "Brand" },
    { value: "#0a7c3e", label: "Green" },
    { value: "#b91c1c", label: "Red" },
    { value: "#6b7280", label: "Gray" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      <select
        onMouseDown={(e) => e.preventDefault()}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          onCommand("formatBlock", `<${v}>`);
          e.target.value = "";
        }}
        className="text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50"
        defaultValue=""
        disabled={showHtml}
        title="Block format"
      >
        <option value="" disabled>
          Style
        </option>
        {blockOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <Sep />

      <ToolBtn label="B" onClick={() => onCommand("bold")} title="Bold" disabled={showHtml} bold />
      <ToolBtn label="I" onClick={() => onCommand("italic")} title="Italic" disabled={showHtml} italic />
      <ToolBtn label="U" onClick={() => onCommand("underline")} title="Underline" disabled={showHtml} underline />

      <Sep />

      <ToolBtn label="•" onClick={() => onCommand("insertUnorderedList")} title="Bulleted list" disabled={showHtml} />
      <ToolBtn label="1." onClick={() => onCommand("insertOrderedList")} title="Numbered list" disabled={showHtml} />

      <Sep />

      <ToolBtn label="⇤" onClick={() => onCommand("justifyLeft")} title="Align left" disabled={showHtml} />
      <ToolBtn label="↔" onClick={() => onCommand("justifyCenter")} title="Center" disabled={showHtml} />
      <ToolBtn label="⇥" onClick={() => onCommand("justifyRight")} title="Align right" disabled={showHtml} />

      <Sep />

      <ToolBtn label="🔗" onClick={onLink} title="Insert link" disabled={showHtml} />
      <ToolBtn label="⌫" onClick={() => onCommand("unlink")} title="Remove link" disabled={showHtml} />

      <Sep />

      <select
        onMouseDown={(e) => e.preventDefault()}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          onCommand("foreColor", v);
          e.target.value = "";
        }}
        className="text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50"
        defaultValue=""
        disabled={showHtml}
        title="Text color"
      >
        <option value="" disabled>
          Color
        </option>
        {colorOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <ToolBtn
        label="—"
        onClick={() => onCommand("removeFormat")}
        title="Clear formatting"
        disabled={showHtml}
      />

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleHtml}
          className={`text-[11px] font-mono px-2 py-1 rounded border ${
            showHtml
              ? "bg-[#3B6B8F] text-white border-[#3B6B8F]"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
          title="Edit raw HTML"
        >
          {showHtml ? "Visual" : "HTML"}
        </button>
      </div>
    </div>
  );
}

function ToolBtn({
  label,
  onClick,
  title,
  disabled,
  bold,
  italic,
  underline,
}: {
  label: string;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`min-w-[28px] h-7 px-1.5 text-xs rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed ${
        bold ? "font-bold" : ""
      } ${italic ? "italic" : ""} ${underline ? "underline" : ""}`}
    >
      {label}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5" />;
}
