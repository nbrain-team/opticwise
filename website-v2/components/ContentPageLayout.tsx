import { readMarkdown } from "@/lib/content";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { FAQAccordion } from "@/components/FAQAccordion";
import { TwoLayerModel } from "@/components/TwoLayerModel";
import { PPP5CProcess } from "@/components/PPP5CProcess";
import { MarkdownPage } from "@/components/MarkdownPage";
import type { Metadata } from "next";

interface ContentPageLayoutProps {
  contentPath: string;
  schemaPath: string;
  showTwoLayerModel?: boolean;
  showPPP5C?: boolean;
}

interface ParsedSection {
  type: "hero" | "content" | "faq" | "cta" | "two-layer" | "ppp5c";
  heading?: string;
  body: string;
}

function parseFAQItems(body: string) {
  const items: { question: string; answer: string }[] = [];
  const lines = body.split("\n");
  let currentQ = "";
  let currentA = "";

  for (const line of lines) {
    const faqMatch = line.match(/^\*\*(?:FAQ|SAQ):\s*(.+?)\*\*\s*$/);
    if (faqMatch) {
      if (currentQ) {
        items.push({ question: currentQ, answer: currentA.trim() });
      }
      currentQ = faqMatch[1];
      currentA = "";
    } else if (currentQ) {
      currentA += line + "\n";
    }
  }
  if (currentQ) {
    items.push({ question: currentQ, answer: currentA.trim() });
  }
  return items;
}

function extractTitle(body: string): string {
  const match = body.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "";
}

function extractSubtitle(body: string): string {
  const lines = body.split("\n").filter((l) => l.trim());
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith("#") && !line.startsWith(">") && !line.startsWith("-") && !line.startsWith("*")) {
      return line;
    }
  }
  return "";
}

function removeTitleFromBody(body: string): string {
  return body.replace(/^#\s+.+\n+/, "").trim();
}

function parseContentSections(markdown: string): ParsedSection[] {
  const blocks = markdown
    .split(/\n---\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const sections: ParsedSection[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const headingMatch = block.match(/^##?\s+(.+)/m);
    const heading = headingMatch ? headingMatch[1].trim() : undefined;
    const lowerBlock = block.toLowerCase();

    if (i === 0) {
      sections.push({ type: "hero", heading, body: block });
    } else if (
      heading?.toLowerCase().startsWith("faq") ||
      (block.match(/\*\*(?:FAQ|SAQ):/g)?.length ?? 0) >= 2
    ) {
      sections.push({ type: "faq", heading, body: block });
    } else if (
      heading?.toLowerCase() === "cta" ||
      (lowerBlock.includes("complementary cre data") && block.length < 300)
    ) {
      sections.push({ type: "cta", heading, body: block });
    } else if (
      lowerBlock.includes("two-layer model") ||
      (lowerBlock.includes("layer 1") && lowerBlock.includes("layer 2"))
    ) {
      sections.push({ type: "two-layer", heading, body: block });
    } else if (
      lowerBlock.includes("ppp 5c") &&
      lowerBlock.includes("clarify") &&
      lowerBlock.includes("connect")
    ) {
      sections.push({ type: "ppp5c", heading, body: block });
    } else {
      sections.push({ type: "content", heading, body: block });
    }
  }

  return sections;
}

export function ContentPageLayout({
  contentPath,
  schemaPath,
  showTwoLayerModel = false,
  showPPP5C = false,
}: ContentPageLayoutProps) {
  const { content } = readMarkdown(contentPath);
  const sections = parseContentSections(content);

  const heroSection = sections.find((s) => s.type === "hero");
  const title = heroSection ? extractTitle(heroSection.body) : "";
  const subtitle = heroSection ? extractSubtitle(heroSection.body) : "";
  const heroBody = heroSection ? removeTitleFromBody(heroSection.body) : "";

  const contentSections = sections.filter((s) => s.type !== "hero");
  let bgAlternate = false;

  return (
    <>
      <SchemaJsonLd path={schemaPath} />

      <PageHero
        title={title}
        description={subtitle}
        showCTA={false}
        compact
      />

      {/* Render remaining hero body if meaningful */}
      {heroBody && heroBody.length > 20 && (
        <section className="py-12 bg-white">
          <div className="ow-container">
            <div className="max-w-3xl mx-auto">
              <MarkdownPage markdown={heroBody} />
            </div>
          </div>
        </section>
      )}

      {contentSections.map((section, idx) => {
        bgAlternate = !bgAlternate;

        if (section.type === "faq") {
          const faqItems = parseFAQItems(section.body);
          if (faqItems.length === 0) return null;
          return (
            <section key={idx} className={`ow-section ${bgAlternate ? "bg-gray-50" : "bg-white"}`}>
              <div className="ow-container">
                <div className="max-w-3xl mx-auto">
                  <h2 className="ow-section-title text-center mb-8">
                    {section.heading || "Frequently Asked Questions"}
                  </h2>
                  <FAQAccordion items={faqItems} />
                </div>
              </div>
            </section>
          );
        }

        if (section.type === "cta") {
          return <CTASection key={idx} variant="blue" />;
        }

        if (section.type === "two-layer") {
          return (
            <section key={idx} className={`ow-section ${bgAlternate ? "bg-gray-50" : "bg-white"}`}>
              <div className="ow-container">
                <h2 className="ow-section-title text-center mb-8">
                  {section.heading || "The Two-Layer Model"}
                </h2>
                <TwoLayerModel />
              </div>
            </section>
          );
        }

        if (section.type === "ppp5c") {
          return (
            <section key={idx} className={`ow-section ${bgAlternate ? "bg-gray-50" : "bg-white"}`}>
              <div className="ow-container">
                <h2 className="ow-section-title text-center mb-8">
                  {section.heading || "The PPP 5C™ Owner Path"}
                </h2>
                <PPP5CProcess />
              </div>
            </section>
          );
        }

        return (
          <section key={idx} className={`ow-section ${bgAlternate ? "bg-gray-50" : "bg-white"}`}>
            <div className="ow-container">
              <div className="max-w-3xl mx-auto">
                <MarkdownPage markdown={section.body} />
              </div>
            </div>
          </section>
        );
      })}

      {/* Always end with CTA if not already present */}
      {!contentSections.some((s) => s.type === "cta") && (
        <CTASection variant="blue" />
      )}
    </>
  );
}
