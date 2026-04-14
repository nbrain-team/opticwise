/**
 * Renders Payload rich text or legacy Ghost HTML content.
 */
export function RichContent({ html }: { html: string | null | undefined }) {
  if (!html) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Content will appear here once it is added.</p>
      </div>
    );
  }

  return <div className="ghost-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
