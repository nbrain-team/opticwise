/**
 * Renders Ghost HTML content with consistent styling.
 * Falls back to a message if Ghost is not connected yet.
 */
export function GhostContent({ html, fallbackMarkdown }: { html: string | null; fallbackMarkdown?: string }) {
  if (!html && !fallbackMarkdown) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Content will appear here once Ghost CMS is connected.</p>
      </div>
    );
  }

  if (html) {
    return <div className="ghost-content" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className="ghost-content">
      <p>{fallbackMarkdown}</p>
    </div>
  );
}
