"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Sprint 2 / 3.2 — Reusable searchable picker with inline-create affordance.
 *
 * Replaces the legacy `<select>` long-list pickers used across the app
 * (deal-create form, transcript-review contact picker, support-ticket
 * routing, etc.) with a single combobox component that:
 *   - filters a server-supplied list of options as the user types,
 *   - optionally falls back to a remote search endpoint for very large
 *     lists (we currently load the first ~500 server-side and only call
 *     remote search when the query length suggests the local set won't
 *     contain the answer),
 *   - exposes a "Create new …" footer that opens a caller-supplied modal
 *     pre-filled with the current query (so the user's typed name is not
 *     lost when they switch from "pick" to "create"),
 *   - on creation, the new option becomes the selected value and the
 *     dropdown closes — the parent form does NOT navigate.
 *
 * The picker submits via a hidden input under `fieldName`, so it drops
 * straight into any existing server-action `<form>` without API changes.
 */

export type PickerOption = {
  id: string;
  label: string;
  sublabel?: string | null;
};

export type RemoteSearch = (query: string) => Promise<PickerOption[]>;

export type RenderCreateModalArgs = {
  initialQuery: string;
  onCreated: (opt: PickerOption) => void;
  onCancel: () => void;
};

export type InlineCreatePickerProps = {
  /** Name of the hidden input rendered for form submission. */
  fieldName: string;
  /** Visible label rendered above the picker. */
  label: string;
  /** Placeholder when nothing is selected. */
  placeholder?: string;
  /** Initial server-loaded option list. */
  initialOptions: PickerOption[];
  /** Initial selection (e.g., when editing). */
  initialValue?: PickerOption | null;
  /** Optional remote search hook used when the local set is too small. */
  remoteSearch?: RemoteSearch;
  /** Footer button text (e.g., "Create new contact"). */
  createLabel: string;
  /** Renders the create modal — supplied by the wrapping picker. */
  renderCreateModal: (args: RenderCreateModalArgs) => ReactNode;
  /** Text shown when "Clear" is allowed. Defaults to "No selection". */
  noneLabel?: string;
  /** When false, hides the "Clear" affordance. */
  allowClear?: boolean;
  /** Required marker rendered next to the label. */
  required?: boolean;
  /** Called when the selected value changes (for controlled-state integration). */
  onChange?: (id: string | null) => void;
};

export function InlineCreatePicker({
  fieldName,
  label,
  placeholder = "Search…",
  initialOptions,
  initialValue,
  remoteSearch,
  createLabel,
  renderCreateModal,
  noneLabel = "— No selection —",
  allowClear = true,
  required = false,
  onChange,
}: InlineCreatePickerProps) {
  const [selected, setSelected] = useState<PickerOption | null>(initialValue ?? null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<PickerOption[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [extraOptions, setExtraOptions] = useState<PickerOption[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const allLocal = useMemo<PickerOption[]>(() => {
    const seen = new Set<string>();
    const merged: PickerOption[] = [];
    for (const opt of [...extraOptions, ...initialOptions]) {
      if (seen.has(opt.id)) continue;
      seen.add(opt.id);
      merged.push(opt);
    }
    return merged;
  }, [extraOptions, initialOptions]);

  const filteredLocal = useMemo<PickerOption[]>(() => {
    if (!query) return allLocal.slice(0, 200);
    const q = query.toLowerCase();
    return allLocal
      .filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 200);
  }, [allLocal, query]);

  const visibleOptions = useMemo<PickerOption[]>(() => {
    // Prefer remote results when available (they may include rows not in the
    // initial local set). Dedup by id, keeping local-first order.
    if (!remoteResults) return filteredLocal;
    const seen = new Set(filteredLocal.map((o) => o.id));
    const merged = [...filteredLocal];
    for (const r of remoteResults) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push(r);
    }
    return merged.slice(0, 200);
  }, [filteredLocal, remoteResults]);

  // Debounced remote search — only when the local set is too small to be
  // confident the answer is there, and only with non-empty queries.
  useEffect(() => {
    if (!remoteSearch || query.length < 2) {
      setRemoteResults(null);
      return;
    }
    let cancelled = false;
    setRemoteLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await remoteSearch(query);
        if (!cancelled) setRemoteResults(results);
      } catch (err) {
        if (!cancelled) {
          console.warn("InlineCreatePicker remote search failed:", err);
          setRemoteResults([]);
        }
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, remoteSearch]);

  // Reset highlight when option set changes.
  useEffect(() => {
    setHighlightIdx(0);
  }, [visibleOptions.length]);

  // Auto-focus the search input when dropdown opens.
  useEffect(() => {
    if (open) {
      // Defer until input is rendered.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback((opt: PickerOption | null) => {
    setSelected(opt);
    setOpen(false);
    setQuery("");
  }, []);

  const handleCreated = useCallback((opt: PickerOption) => {
    setExtraOptions((prev) => [opt, ...prev]);
    setSelected(opt);
    setCreateOpen(false);
    setOpen(false);
    setQuery("");
  }, []);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(visibleOptions.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = visibleOptions[highlightIdx];
        if (opt) handleSelect(opt);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [visibleOptions, highlightIdx, handleSelect]
  );

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={fieldName} value={selected?.id ?? ""} />
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent bg-white flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={
            selected
              ? "text-gray-900 truncate"
              : "text-gray-400 truncate"
          }
        >
          {selected ? selected.label : noneLabel}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && allowClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(null);
                }
              }}
              className="text-gray-400 hover:text-gray-700 cursor-pointer px-1"
              aria-label="Clear selection"
            >
              ×
            </span>
          )}
          <svg
            className="w-4 h-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.24 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="px-2 pt-2 pb-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
            />
          </div>
          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto py-1 text-sm"
          >
            {visibleOptions.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-500">
                {remoteLoading ? "Searching…" : "No matches"}
              </li>
            )}
            {visibleOptions.map((opt, idx) => (
              <li
                key={opt.id}
                role="option"
                aria-selected={selected?.id === opt.id}
                onMouseDown={(e) => {
                  // mousedown beats click — prevents the outside-click handler
                  // from firing first.
                  e.preventDefault();
                  handleSelect(opt);
                }}
                onMouseEnter={() => setHighlightIdx(idx)}
                className={`px-3 py-1.5 cursor-pointer ${
                  idx === highlightIdx ? "bg-[#EAF1F6]" : "hover:bg-gray-50"
                } ${selected?.id === opt.id ? "font-medium" : ""}`}
              >
                <div className="truncate">{opt.label}</div>
                {opt.sublabel && (
                  <div className="text-xs text-gray-500 truncate">{opt.sublabel}</div>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-2 py-1.5 bg-gray-50">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setCreateOpen(true);
              }}
              className="w-full text-left px-2 py-1.5 text-sm text-[#3B6B8F] hover:bg-white rounded flex items-center gap-1.5"
            >
              <span className="text-base leading-none">＋</span>
              <span>
                {createLabel}
                {query && (
                  <>
                    {" "}
                    <span className="text-gray-500">: &ldquo;{query}&rdquo;</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {createOpen &&
        renderCreateModal({
          initialQuery: query,
          onCreated: handleCreated,
          onCancel: () => setCreateOpen(false),
        })}
    </div>
  );
}
