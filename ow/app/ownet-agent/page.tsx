"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Artifact {
  id: string
  type: 'html' | 'svg' | 'mermaid' | 'chart' | 'markdown' | 'react'
  title: string
  content: string
  version: number
  timestamp: string
  prompt: string
}

interface ArtifactGroup {
  artifactId: string
  title: string
  type: string
  versions: Artifact[]
  currentVersion: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  messageId?: string
  plan?: { understanding: string; steps: Array<{ tool: string; reason: string }>; estimated_time: string }
  feedback?: { rating: number; comment?: string }
  artifacts?: Artifact[]
}

interface Session {
  id: string
  title: string
  messageCount?: number
  updatedAt: string
}

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (comment: string, rating?: number) => void
}

// ─── Artifact Parser ─────────────────────────────────────────────────────────

// Flexible regex: matches <artifact ...> with attributes in any order
const ARTIFACT_TAG_REGEX = /<artifact\b([^>]*)>([\s\S]*?)<\/artifact>/g

function extractAttribute(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']*?)["']`))
  return match ? match[1] : ''
}

let artifactIdCounter = 0

// Stable ID map: same content produces the same artifact ID (prevents duplicates during streaming)
const artifactIdMap = new Map<string, string>()

function getStableArtifactId(type: string, title: string, contentHash: string): string {
  const key = `${type}::${title}::${contentHash}`
  if (!artifactIdMap.has(key)) {
    artifactIdCounter++
    artifactIdMap.set(key, `artifact-${artifactIdCounter}-${Date.now()}`)
  }
  return artifactIdMap.get(key)!
}

// Fenced code-block fallback regex (```html ... ```, ```svg ... ```, ```mermaid ... ```)
const FENCED_VISUAL_REGEX = /```(html|svg|mermaid|chart)\s*\n([\s\S]*?)```/g

// Heuristic: detect raw HTML document content not wrapped in any tag/fence
function looksLikeFullHtmlDocument(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    (lower.includes('<!doctype html') || lower.includes('<html')) &&
    lower.includes('</html>')
  )
}

function deriveTitleFromPrompt(prompt: string, fallback = 'Visualization'): string {
  if (!prompt) return fallback
  const trimmed = prompt.trim().slice(0, 80)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function parseArtifacts(text: string, userPrompt: string): { cleanText: string; artifacts: Artifact[] } {
  const artifacts: Artifact[] = []
  let cleanText = text

  // Pass 1: explicit <artifact> tags
  ARTIFACT_TAG_REGEX.lastIndex = 0
  const matches = [...text.matchAll(ARTIFACT_TAG_REGEX)]

  for (const match of matches) {
    const [fullMatch, attrs, content] = match
    const type = extractAttribute(attrs, 'type') || 'html'
    const title = extractAttribute(attrs, 'title') || 'Artifact'
    const trimmedContent = content.trim()

    const contentHash = trimmedContent.slice(0, 200)
    const id = getStableArtifactId(type, title, contentHash)

    const artifact: Artifact = {
      id,
      type: type as Artifact['type'],
      title,
      content: trimmedContent,
      version: 1,
      timestamp: new Date().toISOString(),
      prompt: userPrompt,
    }
    artifacts.push(artifact)
    cleanText = cleanText.replace(fullMatch, `\n\n[artifact:${id}:${title}:${type}]\n\n`)
  }

  // Pass 2: fenced code-block fallback for ```html / ```svg / ```mermaid / ```chart
  // Only run if no explicit artifact tags were found (avoid double-extraction)
  if (artifacts.length === 0) {
    FENCED_VISUAL_REGEX.lastIndex = 0
    const fencedMatches = [...cleanText.matchAll(FENCED_VISUAL_REGEX)]

    for (const match of fencedMatches) {
      const [fullMatch, lang, content] = match
      const type = lang.toLowerCase() as Artifact['type']
      const trimmedContent = content.trim()
      // Skip tiny snippets (e.g. inline tag examples)
      if (trimmedContent.length < 80) continue

      const title = deriveTitleFromPrompt(userPrompt, `${type.toUpperCase()} Visualization`)
      const contentHash = trimmedContent.slice(0, 200)
      const id = getStableArtifactId(type, title, contentHash)

      const artifact: Artifact = {
        id,
        type,
        title,
        content: trimmedContent,
        version: 1,
        timestamp: new Date().toISOString(),
        prompt: userPrompt,
      }
      artifacts.push(artifact)
      cleanText = cleanText.replace(fullMatch, `\n\n[artifact:${id}:${title}:${type}]\n\n`)
    }
  }

  // Pass 3: raw full-HTML-document fallback (no fence, no tag — Claude dumped a doc)
  if (artifacts.length === 0 && looksLikeFullHtmlDocument(cleanText)) {
    const lower = cleanText.toLowerCase()
    const startDoctype = lower.indexOf('<!doctype html')
    const startHtml = lower.indexOf('<html')
    const start = startDoctype !== -1 ? startDoctype : startHtml
    const endTag = '</html>'
    const endIdx = lower.lastIndexOf(endTag)
    if (start !== -1 && endIdx !== -1 && endIdx > start) {
      const fullDoc = cleanText.slice(start, endIdx + endTag.length)
      const title = deriveTitleFromPrompt(userPrompt, 'Visualization')
      const contentHash = fullDoc.slice(0, 200)
      const id = getStableArtifactId('html', title, contentHash)

      const artifact: Artifact = {
        id,
        type: 'html',
        title,
        content: fullDoc,
        version: 1,
        timestamp: new Date().toISOString(),
        prompt: userPrompt,
      }
      artifacts.push(artifact)
      cleanText = cleanText.replace(fullDoc, `\n\n[artifact:${id}:${title}:html]\n\n`)
    }
  }

  // Pass 4: HTML fragment (no <html>/doctype, but has <style> and/or substantial body markup)
  // This catches the common Claude failure mode of dumping <style>...</style><div>...</div>
  // without any document wrapper.
  if (artifacts.length === 0) {
    const styleStart = cleanText.toLowerCase().indexOf('<style')
    if (styleStart !== -1) {
      // Find the start of the visual content — back up to the start of the line containing <style
      const beforeStyle = cleanText.slice(0, styleStart)
      const lineStart = beforeStyle.lastIndexOf('\n')
      const start = lineStart === -1 ? styleStart : lineStart + 1
      // The visual content extends to the end of the message (everything from <style onward)
      const fragment = cleanText.slice(start).trim()
      if (fragment.length > 100) {
        const title = deriveTitleFromPrompt(userPrompt, 'Visualization')
        const contentHash = fragment.slice(0, 200)
        const id = getStableArtifactId('html', title, contentHash)

        // Wrap fragment in a minimal HTML doc so it renders in the iframe
        const wrappedHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>${fragment}</body></html>`

        const artifact: Artifact = {
          id,
          type: 'html',
          title,
          content: wrappedHtml,
          version: 1,
          timestamp: new Date().toISOString(),
          prompt: userPrompt,
        }
        artifacts.push(artifact)
        cleanText = cleanText.slice(0, start).trimEnd() + `\n\n[artifact:${id}:${title}:html]\n\n`
      }
    }
  }

  // Pass 5: raw CSS dump (no <style>, no HTML tags) — Claude sometimes outputs ONLY CSS
  // Detect 3+ CSS rule lines like "selector { ... }" or block comments
  if (artifacts.length === 0) {
    const cssRulePattern = /(?:^|\n)\s*(?:\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/\s*)?[.#]?[a-zA-Z_*][\w-]*(?:\s*[>+~,]\s*[.#]?[a-zA-Z_*][\w-]*)*\s*\{/g
    const ruleMatches = [...cleanText.matchAll(cssRulePattern)]
    if (ruleMatches.length >= 3) {
      // Find the start of the first CSS rule's line (or its preceding comment)
      const firstMatch = ruleMatches[0]
      const matchIdx = firstMatch.index ?? 0
      // Back up to find the line start (and pull in any leading /* comment block */ lines)
      const beforeFirst = cleanText.slice(0, matchIdx)
      const lineStart = beforeFirst.lastIndexOf('\n')
      const start = lineStart === -1 ? matchIdx : lineStart + 1

      const cssDump = cleanText.slice(start).trim()
      if (cssDump.length > 100) {
        const title = deriveTitleFromPrompt(userPrompt, 'Visualization')
        const contentHash = cssDump.slice(0, 200)
        const id = getStableArtifactId('html', title, contentHash)

        // Wrap the raw CSS in a minimal HTML doc with a placeholder body so something renders
        const wrappedHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssDump}</style>
</head>
<body>
<div class="container">
<div class="header"><div class="eyebrow">Visualization</div><h1>${title}</h1></div>
<p style="color:#666;text-align:center;padding:40px;">CSS-only output detected. The original response did not include matching HTML markup, so only styles are loaded. Please ask the agent to regenerate with full HTML.</p>
</div>
</body></html>`

        const artifact: Artifact = {
          id,
          type: 'html',
          title,
          content: wrappedHtml,
          version: 1,
          timestamp: new Date().toISOString(),
          prompt: userPrompt,
        }
        artifacts.push(artifact)
        cleanText = cleanText.slice(0, start).trimEnd() + `\n\n[artifact:${id}:${title}:html]\n\n`
      }
    }
  }

  return { cleanText, artifacts }
}

function hasPartialArtifactTag(text: string): boolean {
  const lastOpen = text.lastIndexOf('<artifact')
  if (lastOpen === -1) return false
  const afterOpen = text.slice(lastOpen)
  return !afterOpen.includes('</artifact>')
}

// Detect an unclosed ```html / ```svg / ```mermaid / ```chart fence during streaming
function hasPartialVisualFence(text: string): { partial: boolean; openIdx: number } {
  const fenceRegex = /```(html|svg|mermaid|chart)\s*\n/gi
  let match: RegExpExecArray | null
  let lastOpen = -1
  while ((match = fenceRegex.exec(text)) !== null) {
    lastOpen = match.index
  }
  if (lastOpen === -1) return { partial: false, openIdx: -1 }
  const afterOpen = text.slice(lastOpen + 3) // skip past the opening ```
  const closing = afterOpen.indexOf('```')
  return { partial: closing === -1, openIdx: lastOpen }
}

// Detect raw HTML document being streamed (no fence, no artifact tag)
function hasPartialRawHtml(text: string): { partial: boolean; openIdx: number } {
  const lower = text.toLowerCase()
  const lastDoctype = lower.lastIndexOf('<!doctype html')
  const lastHtmlOpen = lower.lastIndexOf('<html')
  const openIdx = Math.max(lastDoctype, lastHtmlOpen)
  if (openIdx === -1) return { partial: false, openIdx: -1 }
  const afterOpen = lower.slice(openIdx)
  const hasClose = afterOpen.includes('</html>')
  return { partial: !hasClose, openIdx }
}

// Detect raw <style> block being streamed (no doctype, no artifact tag, no fence)
function hasPartialStyleFragment(text: string): { partial: boolean; openIdx: number } {
  const lower = text.toLowerCase()
  const styleIdx = lower.indexOf('<style')
  if (styleIdx === -1) return { partial: false, openIdx: -1 }
  // Back up to start of the line containing <style so the entire fragment is hidden
  const beforeStyle = text.slice(0, styleIdx)
  const lineStart = beforeStyle.lastIndexOf('\n')
  const openIdx = lineStart === -1 ? styleIdx : lineStart + 1
  // Always treat as partial during streaming until the message completes —
  // the final-pass parser will extract it at end-of-stream.
  return { partial: true, openIdx }
}

// Detect a raw CSS dump being streamed (3+ "selector {" rule lines, no <style> wrapper)
function hasPartialCssDump(text: string): { partial: boolean; openIdx: number } {
  // Don't trigger if there's an HTML/style/artifact context — those are handled separately
  const lower = text.toLowerCase()
  if (lower.includes('<style') || lower.includes('<html') || lower.includes('<!doctype') || lower.includes('<artifact')) {
    return { partial: false, openIdx: -1 }
  }
  const cssRulePattern = /(?:^|\n)\s*(?:\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/\s*)?[.#]?[a-zA-Z_*][\w-]*(?:\s*[>+~,]\s*[.#]?[a-zA-Z_*][\w-]*)*\s*\{/g
  const ruleMatches = [...text.matchAll(cssRulePattern)]
  if (ruleMatches.length < 3) return { partial: false, openIdx: -1 }
  const firstMatch = ruleMatches[0]
  const matchIdx = firstMatch.index ?? 0
  const beforeFirst = text.slice(0, matchIdx)
  const lineStart = beforeFirst.lastIndexOf('\n')
  const openIdx = lineStart === -1 ? matchIdx : lineStart + 1
  return { partial: true, openIdx }
}

// Strip any raw <artifact> tags that might slip into display content
function sanitizeForDisplay(text: string): string {
  return text
    .replace(/<artifact\b[^>]*>/g, '')
    .replace(/<\/artifact>/g, '')
}

// ─── Base HTML Template for iframe ───────────────────────────────────────────

function buildArtifactHtml(artifact: Artifact): string {
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://esm.sh https://cdnjs.cloudflare.com; img-src * data: blob:; font-src * data:; connect-src 'none'; frame-src 'none';">`

  if (artifact.type === 'mermaid') {
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${csp}
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #fff; color: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .mermaid { max-width: 100%; }
</style>
</head><body>
<div class="mermaid">${artifact.content}</div>
<script>mermaid.initialize({ startOnLoad: true, theme: 'default' });<\/script>
</body></html>`
  }

  if (artifact.type === 'chart') {
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${csp}
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #fff; color: #1a1a2e; }
  canvas { max-width: 100%; }
</style>
</head><body>
<canvas id="chart-canvas"></canvas>
<script>
try {
  const config = ${artifact.content};
  new Chart(document.getElementById('chart-canvas'), config);
} catch(e) {
  document.body.innerHTML = '<pre style="color:red;">Chart Error: ' + e.message + '<\/pre>';
}
<\/script>
</body></html>`
  }

  if (artifact.type === 'svg') {
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${csp}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #fff; color: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  svg { max-width: 100%; height: auto; }
</style>
</head><body>
${artifact.content}
</body></html>`
  }

  if (artifact.type === 'markdown') {
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${csp}
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"><\/script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; background: #fff; color: #1a1a2e; line-height: 1.7; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 1.8em; margin: 1em 0 0.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
  h2 { font-size: 1.4em; margin: 1em 0 0.4em; }
  h3 { font-size: 1.15em; margin: 0.8em 0 0.3em; }
  p { margin: 0.6em 0; }
  ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
  blockquote { border-left: 3px solid #3B6B8F; padding-left: 16px; margin: 1em 0; color: #475569; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; }
</style>
</head><body>
<div id="content"></div>
<script>
  document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(artifact.content)});
<\/script>
</body></html>`
  }

  // Default: html type — inject content into base template
  const isFullHtml = artifact.content.trim().toLowerCase().startsWith('<!doctype') || artifact.content.trim().toLowerCase().startsWith('<html')
  if (isFullHtml) {
    return artifact.content
  }

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${csp}
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/d3@7"><\/script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"><\/script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #ffffff; color: #1a1a2e; line-height: 1.6; }
  h1, h2, h3, h4 { color: #0f172a; margin-bottom: 0.5em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; color: #334155; }
  tr:nth-child(even) { background: #fafbfc; }
</style>
</head><body>
${artifact.content}
<script>
  if (document.querySelector('.mermaid')) {
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  }
<\/script>
</body></html>`
}

// ─── Artifact Card in Chat ───────────────────────────────────────────────────

function ArtifactCard({
  artifact,
  onClick,
}: {
  artifact: Artifact
  onClick: () => void
}) {
  const typeIcons: Record<string, string> = {
    html: '{ }',
    svg: '◇',
    mermaid: '⎔',
    chart: '▥',
    markdown: '¶',
    react: '⚛',
  }

  return (
    <button
      onClick={onClick}
      className="my-3 w-full text-left border border-[#3B6B8F]/20 rounded-lg p-3 bg-gradient-to-r from-[#3B6B8F]/5 to-transparent hover:from-[#3B6B8F]/10 hover:border-[#3B6B8F]/40 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#3B6B8F]/10 flex items-center justify-center text-[#3B6B8F] font-mono text-sm flex-shrink-0 group-hover:bg-[#3B6B8F]/20 transition-colors">
          {typeIcons[artifact.type] || '◈'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {artifact.title}
          </div>
          <div className="text-xs text-gray-500">
            {artifact.type.toUpperCase()} · Version {artifact.version}
          </div>
        </div>
        <div className="text-xs text-[#3B6B8F] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          Click to view →
        </div>
      </div>
    </button>
  )
}

// ─── Artifact Panel ──────────────────────────────────────────────────────────

function ArtifactPanel({
  artifactGroups,
  activeArtifact,
  onClose,
  onSelectArtifact,
  onVersionChange,
}: {
  artifactGroups: ArtifactGroup[]
  activeArtifact: Artifact | null
  onClose: () => void
  onSelectArtifact: (artifact: Artifact) => void
  onVersionChange: (groupId: string, version: number) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

  const activeGroup = useMemo(() => {
    if (!activeArtifact) return null
    return artifactGroups.find(g =>
      g.versions.some(v => v.id === activeArtifact.id)
    )
  }, [activeArtifact, artifactGroups])

  useEffect(() => {
    if (activeArtifact && iframeRef.current && activeTab === 'preview') {
      const html = buildArtifactHtml(activeArtifact)
      iframeRef.current.srcdoc = html
    }
  }, [activeArtifact, activeTab])

  const copyCode = useCallback(() => {
    if (!activeArtifact) return
    navigator.clipboard.writeText(activeArtifact.content).then(() => {
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    })
  }, [activeArtifact])

  const downloadHtml = useCallback(() => {
    if (!activeArtifact) return
    const html = buildArtifactHtml(activeArtifact)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeArtifact.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeArtifact])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(f => !f)
  }, [])

  if (!activeArtifact) return null

  const panelClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : 'w-[45%] min-w-[400px] border-l border-gray-200 bg-white flex flex-col'

  return (
    <div className={panelClasses}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/80 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {activeArtifact.title}
          </h3>
          <span className="text-xs px-2 py-0.5 bg-[#3B6B8F]/10 text-[#3B6B8F] rounded-full font-medium flex-shrink-0">
            {activeArtifact.type.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Version selector */}
          {activeGroup && activeGroup.versions.length > 1 && (
            <select
              value={activeGroup.currentVersion}
              onChange={(e) => onVersionChange(activeGroup.artifactId, Number(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white mr-2"
            >
              {activeGroup.versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
          )}
          {/* Tab toggle */}
          <div className="flex bg-gray-200 rounded-md p-0.5 mr-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${activeTab === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Code
            </button>
          </div>
          {/* Action buttons */}
          <button onClick={copyCode} className="p-1.5 rounded hover:bg-gray-200 transition-colors" title="Copy code">
            {copyStatus === 'copied' ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
          </button>
          <button onClick={downloadHtml} className="p-1.5 rounded hover:bg-gray-200 transition-colors" title="Download HTML">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-gray-200 transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-200 transition-colors ml-1" title="Close panel">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' ? (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            title={activeArtifact.title}
            className="w-full h-full border-none"
            style={{ borderRadius: '0' }}
          />
        ) : (
          <div className="h-full overflow-auto p-4">
            <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words bg-gray-50 rounded-lg p-4 border border-gray-200">
              {activeArtifact.content}
            </pre>
          </div>
        )}
      </div>

      {/* Artifact History */}
      {artifactGroups.length > 1 && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50/50 flex-shrink-0">
          <div className="text-xs font-medium text-gray-500 mb-1.5">All Artifacts</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {artifactGroups.map((group) => {
              const current = group.versions[group.currentVersion - 1] || group.versions[group.versions.length - 1]
              const isActive = current.id === activeArtifact.id
              return (
                <button
                  key={group.artifactId}
                  onClick={() => onSelectArtifact(current)}
                  className={`text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors flex-shrink-0 ${
                    isActive
                      ? 'bg-[#3B6B8F] text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {group.title}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Feedback Modal ──────────────────────────────────────────────────────────

function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    
    setIsSubmitting(true)
    await onSubmit(comment, rating || undefined)
    setComment('')
    setRating(null)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add Feedback</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Your feedback helps improve the AI assistant
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How helpful was this response?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg transition-all ${
                    rating && rating >= star
                      ? 'text-amber-400 scale-110'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments or suggestions
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could be improved? Was anything incorrect or missing?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 px-4 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function OWnetAgentPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    messageId: string | null
    messageIndex: number
  }>({ isOpen: false, messageId: null, messageIndex: -1 })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Artifact state
  const [artifactGroups, setArtifactGroups] = useState<ArtifactGroup[]>([])
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null)
  const [showArtifactPanel, setShowArtifactPanel] = useState(false)
  const lastUserPromptRef = useRef('')

  useEffect(() => {
    loadSessions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId)
      setArtifactGroups([])
      setActiveArtifact(null)
      setShowArtifactPanel(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addArtifactToGroups = useCallback((artifact: Artifact) => {
    setArtifactGroups(prev => {
      const existingGroupIndex = prev.findIndex(g => g.title === artifact.title && g.type === artifact.type)
      if (existingGroupIndex >= 0) {
        const group = prev[existingGroupIndex]
        // Skip if this exact artifact ID already exists (streaming re-parse)
        if (group.versions.some(v => v.id === artifact.id)) {
          // Update the content of the existing version (may have grown during streaming)
          const updated = [...prev]
          const updatedGroup = { ...group }
          updatedGroup.versions = group.versions.map(v =>
            v.id === artifact.id ? { ...v, content: artifact.content } : v
          )
          updated[existingGroupIndex] = updatedGroup
          return updated
        }
        // New version of an existing artifact
        const updated = [...prev]
        const updatedGroup = { ...group }
        const newVersion = group.versions.length + 1
        const versionedArtifact = { ...artifact, version: newVersion }
        updatedGroup.versions = [...group.versions, versionedArtifact]
        updatedGroup.currentVersion = newVersion
        updated[existingGroupIndex] = updatedGroup
        return updated
      }
      return [...prev, {
        artifactId: artifact.id,
        title: artifact.title,
        type: artifact.type,
        versions: [artifact],
        currentVersion: 1,
      }]
    })
  }, [])

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/ownet/sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
        if (!currentSessionId && data.sessions.length > 0) {
          setCurrentSessionId(data.sessions[0].id)
        } else if (data.sessions.length === 0) {
          await createNewSession()
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/ownet/sessions/${sessionId}`)
      const data = await res.json()
      if (data.success) {
        const mappedMessages = data.messages.map((m: { role: 'user' | 'assistant'; content: string; id?: string }) => {
          if (m.role === 'assistant') {
            const { cleanText, artifacts } = parseArtifacts(m.content, '')
            if (artifacts.length > 0) {
              artifacts.forEach(a => addArtifactToGroups(a))
              return { role: m.role, content: cleanText, messageId: m.id, artifacts }
            }
          }
          return { role: m.role, content: m.content, messageId: m.id }
        })
        setMessages(mappedMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/ownet/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => [data.session, ...prev])
        setCurrentSessionId(data.session.id)
        setMessages([])
        setArtifactGroups([])
        setActiveArtifact(null)
        setShowArtifactPanel(false)
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentSessionId || isLoading) return

    const userMessage = input.trim()
    lastUserPromptRef.current = userMessage
    setInput('')
    setIsLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    const assistantIndex = messages.length + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ownet/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
        }),
      })

      if (!res.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullResponse = ''
      let messageId = ''
      let sources: string[] | undefined = undefined

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'progress') {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[assistantIndex] = {
                      role: 'assistant',
                      content: `*${data.message}*`
                    }
                    return newMessages
                  })
                } else if (data.type === 'plan') {
                  const planText = `**Execution Plan:**\n\n${data.plan.understanding}\n\n**Steps:**\n${data.plan.steps.map((s: { tool: string; reason: string }, i: number) => `${i + 1}. ${s.tool} - ${s.reason}`).join('\n')}\n\n*Estimated time: ${data.plan.estimated_time}*\n\n---\n\n`
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[assistantIndex] = {
                      role: 'assistant',
                      content: planText,
                      plan: data.plan
                    }
                    return newMessages
                  })
                } else if (data.type === 'content') {
                  fullResponse += data.text
                  
                  // While streaming, check for partial artifact tags / fenced visuals /
                  // raw HTML docs / <style> fragments / raw CSS dumps and hide them from the chat
                  // (they'll render in the artifact panel once complete)
                  const partialArtifact = hasPartialArtifactTag(fullResponse)
                  const partialFence = !partialArtifact ? hasPartialVisualFence(fullResponse) : { partial: false, openIdx: -1 }
                  const partialRawHtml = (!partialArtifact && !partialFence.partial)
                    ? hasPartialRawHtml(fullResponse)
                    : { partial: false, openIdx: -1 }
                  const partialStyle = (!partialArtifact && !partialFence.partial && !partialRawHtml.partial)
                    ? hasPartialStyleFragment(fullResponse)
                    : { partial: false, openIdx: -1 }
                  const partialCss = (!partialArtifact && !partialFence.partial && !partialRawHtml.partial && !partialStyle.partial)
                    ? hasPartialCssDump(fullResponse)
                    : { partial: false, openIdx: -1 }

                  if (partialArtifact || partialFence.partial || partialRawHtml.partial || partialStyle.partial || partialCss.partial) {
                    let cutIdx = fullResponse.length
                    if (partialArtifact) cutIdx = fullResponse.lastIndexOf('<artifact')
                    else if (partialFence.partial) cutIdx = partialFence.openIdx
                    else if (partialRawHtml.partial) cutIdx = partialRawHtml.openIdx
                    else if (partialStyle.partial) cutIdx = partialStyle.openIdx
                    else if (partialCss.partial) cutIdx = partialCss.openIdx

                    const displayText = sanitizeForDisplay(fullResponse.slice(0, cutIdx))
                    setMessages(prev => {
                      const newMessages = [...prev]
                      newMessages[assistantIndex] = {
                        role: 'assistant',
                        content: displayText + '\n\n*Generating visual artifact...*'
                      }
                      return newMessages
                    })
                  } else {
                    // Parse complete artifacts from the stream
                    const { cleanText, artifacts: parsedArtifacts } = parseArtifacts(fullResponse, lastUserPromptRef.current)
                    const newArtifacts = parsedArtifacts.length > 0 ? parsedArtifacts : undefined
                    
                    if (newArtifacts) {
                      newArtifacts.forEach(a => {
                        addArtifactToGroups(a)
                      })
                      const latest = newArtifacts[newArtifacts.length - 1]
                      setActiveArtifact(latest)
                      setShowArtifactPanel(true)
                    }
                    
                    setMessages(prev => {
                      const newMessages = [...prev]
                      newMessages[assistantIndex] = {
                        role: 'assistant',
                        content: sanitizeForDisplay(cleanText),
                        artifacts: newArtifacts,
                      }
                      return newMessages
                    })
                  }
                } else if (data.type === 'meta') {
                  console.log('[OWnet] Meta:', data.message)
                } else if (data.type === 'complete') {
                  messageId = data.messageId
                  sources = data.sources

                  // Final parse of the complete response
                  const { cleanText, artifacts: finalParsed } = parseArtifacts(fullResponse, lastUserPromptRef.current)
                  const finalArtifacts = finalParsed.length > 0 ? finalParsed : undefined

                  if (finalArtifacts) {
                    finalArtifacts.forEach(a => {
                      addArtifactToGroups(a)
                    })
                    const last = finalArtifacts[finalArtifacts.length - 1]
                    setActiveArtifact(last)
                    setShowArtifactPanel(true)
                  }

                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[assistantIndex] = {
                      role: 'assistant',
                      content: sanitizeForDisplay(cleanText),
                      sources: sources,
                      messageId: messageId,
                      artifacts: finalArtifacts,
                    }
                    return newMessages
                  })
                  
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                  
                  setTimeout(() => {
                    loadSessions()
                  }, 500)
                } else if (data.type === 'error') {
                  throw new Error(data.details || data.error)
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[assistantIndex] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this chat?')) return

    try {
      await fetch(`/api/ownet/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions[0]?.id || null)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const submitFeedback = async (comment: string, rating?: number) => {
    if (!feedbackModal.messageId || !currentSessionId) return

    try {
      const res = await fetch('/api/ownet/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messageId: feedbackModal.messageId,
          comment,
          rating,
        }),
      })

      const data = await res.json()
      if (data.success) {
        console.log('Feedback submitted successfully')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const openFeedbackModal = (messageId: string | undefined, messageIndex: number) => {
    if (!messageId) {
      console.error('Message ID not available for feedback')
      return
    }
    setFeedbackModal({
      isOpen: true,
      messageId,
      messageIndex,
    })
  }

  const handleArtifactVersionChange = useCallback((groupId: string, version: number) => {
    setArtifactGroups(prev => {
      const updated = prev.map(g => {
        if (g.artifactId === groupId) {
          const target = g.versions[version - 1]
          if (target) {
            setActiveArtifact(target)
          }
          return { ...g, currentVersion: version }
        }
        return g
      })
      return updated
    })
  }, [])

  // Render artifact indicator inline in markdown
  const renderMessageContent = useCallback((msg: Message, idx: number) => {
    const artifactCardRegex = /\[artifact:([^\]:]+):([^\]:]+):([^\]]+)\]/g
    const parts: (string | { artifactId: string; title: string; type: string })[] = []
    let lastIndex = 0
    let match

    while ((match = artifactCardRegex.exec(msg.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(msg.content.slice(lastIndex, match.index))
      }
      parts.push({ artifactId: match[1], title: match[2], type: match[3] })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < msg.content.length) {
      parts.push(msg.content.slice(lastIndex))
    }

    return (
      <>
        {parts.map((part, partIdx) => {
          if (typeof part === 'string') {
            if (!part.trim()) return null
            return (
              <div key={partIdx} className="prose prose-sm max-w-none 
                [&>h1]:text-black [&>h1]:font-bold [&>h1]:text-xl [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:pb-2 [&>h1]:border-b [&>h1]:border-gray-200
                [&>h2]:text-black [&>h2]:font-bold [&>h2]:text-lg [&>h2]:mt-8 [&>h2]:mb-4
                [&>h3]:text-black [&>h3]:font-semibold [&>h3]:text-base [&>h3]:mt-6 [&>h3]:mb-3
                [&>h4]:text-gray-900 [&>h4]:font-semibold [&>h4]:mt-5 [&>h4]:mb-2
                [&>p]:text-gray-800 [&>p]:leading-7 [&>p]:my-4
                [&>ul]:my-4 [&>ul]:space-y-2 [&>ul]:ml-4
                [&>ol]:my-4 [&>ol]:space-y-2 [&>ol]:ml-4
                [&>li]:text-gray-800 [&>li]:leading-6
                [&>strong]:text-black [&>strong]:font-bold
                [&>hr]:my-8 [&>hr]:border-gray-300
                [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:my-6 [&>blockquote]:py-2 [&>blockquote]:bg-blue-50/50
                [&>code]:bg-gray-100 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
                [&_ul_ul]:mt-2 [&_ul_ul]:mb-0
                [&_ol_ol]:mt-2 [&_ol_ol]:mb-0
                [&_details]:my-4
                [&_details>summary]:cursor-pointer [&_details>summary]:font-semibold [&_details>summary]:text-gray-900
                [&_details>summary]:hover:text-[#3B6B8F] [&_details>summary]:transition-colors
                [&_details>summary]:select-none [&_details>summary]:list-none
                [&_details[open]>summary]:mb-3
              ">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{sanitizeForDisplay(part)}</ReactMarkdown>
              </div>
            )
          }
          // Render artifact card
          const artifact = msg.artifacts?.find(a => a.id === part.artifactId)
          if (artifact) {
            return (
              <ArtifactCard
                key={partIdx}
                artifact={artifact}
                onClick={() => {
                  setActiveArtifact(artifact)
                  setShowArtifactPanel(true)
                }}
              />
            )
          }
          // Fallback: look in all artifact groups
          const group = artifactGroups.find(g => g.versions.some(v => v.id === part.artifactId))
          if (group) {
            const current = group.versions[group.currentVersion - 1] || group.versions[group.versions.length - 1]
            return (
              <ArtifactCard
                key={partIdx}
                artifact={current}
                onClick={() => {
                  setActiveArtifact(current)
                  setShowArtifactPanel(true)
                }}
              />
            )
          }
          return null
        })}
      </>
    )
  }, [artifactGroups])

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar - Chat History */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#3B6B8F]/5 to-transparent">
          <button
            onClick={createNewSession}
            className="w-full px-4 py-2.5 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-2">
            Chat History
          </div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                currentSessionId === session.id 
                  ? 'bg-[#3B6B8F]/10 border border-[#3B6B8F]/30 shadow-sm' 
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div onClick={() => setCurrentSessionId(session.id)}>
                <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="truncate">{session.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 pl-6">
                  {session.messageCount || 0} messages
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(session.id)
                }}
                className="text-xs text-gray-400 hover:text-red-600 mt-2 pl-6 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              No chat history yet
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-2xl font-bold text-[#50555C]">OWnet Agent</h1>
          {artifactGroups.length > 0 && !showArtifactPanel && (
            <button
              onClick={() => {
                if (activeArtifact) {
                  setShowArtifactPanel(true)
                } else {
                  const lastGroup = artifactGroups[artifactGroups.length - 1]
                  const last = lastGroup.versions[lastGroup.currentVersion - 1] || lastGroup.versions[lastGroup.versions.length - 1]
                  setActiveArtifact(last)
                  setShowArtifactPanel(true)
                }
              }}
              className="flex items-center gap-2 text-sm px-3 py-1.5 bg-[#3B6B8F]/10 text-[#3B6B8F] rounded-lg hover:bg-[#3B6B8F]/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Show Artifacts ({artifactGroups.length})
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B6B8F]/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-[#3B6B8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg mb-2">Ask me anything about Opticwise!</p>
              <p className="text-sm mb-4">
                I can search through call transcripts, find client information, and help with your CRM.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                <span className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Charts & Dashboards</span>
                <span className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Process Diagrams</span>
                <span className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Data Visualizations</span>
                <span className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Interactive Tools</span>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-[#3B6B8F] text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <>
                    {renderMessageContent(msg, idx)}
                    
                    {/* Feedback buttons */}
                    {msg.messageId && !msg.feedback && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <button
                          onClick={async () => {
                            await fetch('/api/ownet/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                messageId: msg.messageId,
                                rating: 5,
                                category: 'helpful',
                              }),
                            });
                            setMessages(prev => {
                              const newMessages = [...prev];
                              newMessages[idx] = { ...msg, feedback: { rating: 5 } };
                              return newMessages;
                            });
                          }}
                          className="p-1.5 rounded hover:bg-green-50 transition-colors"
                          title="Thumbs up"
                        >
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            await fetch('/api/ownet/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                messageId: msg.messageId,
                                rating: 1,
                                category: 'not_helpful',
                              }),
                            });
                            setMessages(prev => {
                              const newMessages = [...prev];
                              newMessages[idx] = { ...msg, feedback: { rating: 1 } };
                              return newMessages;
                            });
                          }}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Thumbs down"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {msg.feedback && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        Feedback received
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Sources: {msg.sources.join(', ')}
                  </div>
                )}
                
                {msg.role === 'assistant' && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => openFeedbackModal(msg.messageId, idx)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#3B6B8F] transition-colors group"
                      title="Add feedback for training"
                    >
                      <span className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-[#3B6B8F]/10 flex items-center justify-center transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Feedback</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-pulse">●</div>
                  <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</div>
                  <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</div>
                  <span className="ml-2 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about transcripts, deals, or request a visualization..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              disabled={isLoading || !currentSessionId}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !currentSessionId}
              className="px-6 py-3 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
          
          {!currentSessionId && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Create a new chat to get started
            </p>
          )}
        </div>
      </div>

      {/* Artifact Panel - slides in from right */}
      {showArtifactPanel && (
        <ArtifactPanel
          artifactGroups={artifactGroups}
          activeArtifact={activeArtifact}
          onClose={() => setShowArtifactPanel(false)}
          onSelectArtifact={(artifact) => setActiveArtifact(artifact)}
          onVersionChange={handleArtifactVersionChange}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, messageId: null, messageIndex: -1 })}
        onSubmit={submitFeedback}
      />
    </div>
  )
}
