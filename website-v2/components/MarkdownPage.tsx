import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPageProps {
  markdown: string;
  className?: string;
}

export function MarkdownPage({ markdown, className = "" }: MarkdownPageProps) {
  return (
    <article className={`prose-ow ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
