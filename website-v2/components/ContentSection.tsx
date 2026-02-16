import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ContentSectionProps {
  markdown: string;
  variant?: "light" | "white" | "gray" | "dark";
  className?: string;
  maxWidth?: "narrow" | "wide" | "full";
}

export function ContentSection({
  markdown,
  variant = "white",
  className = "",
  maxWidth = "narrow",
}: ContentSectionProps) {
  const bgMap = {
    light: "bg-gray-50",
    white: "bg-white",
    gray: "bg-gray-100",
    dark: "bg-ow-navy text-white",
  };

  const proseClass = variant === "dark" ? "prose-dark" : "prose-ow";

  const widthMap = {
    narrow: "max-w-3xl",
    wide: "max-w-5xl",
    full: "max-w-none",
  };

  return (
    <section className={`ow-section ${bgMap[variant]} ${className}`}>
      <div className="ow-container">
        <div className={`${widthMap[maxWidth]} mx-auto`}>
          <article className={proseClass}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </section>
  );
}
