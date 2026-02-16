import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();

export function readMarkdown(relPath: string) {
  const full = path.join(ROOT, relPath);
  const raw = fs.readFileSync(full, "utf8");
  const parsed = matter(raw);
  return { content: parsed.content, data: parsed.data ?? {} };
}

export interface MarkdownSection {
  type: "hero" | "content" | "faq" | "cta";
  heading?: string;
  body: string;
}

export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const blocks = markdown.split(/\n---\n/).map((b) => b.trim()).filter(Boolean);
  const sections: MarkdownSection[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const headingMatch = block.match(/^##?\s+(.+)/m);
    const heading = headingMatch ? headingMatch[1].trim() : undefined;

    if (i === 0) {
      sections.push({ type: "hero", heading, body: block });
    } else if (heading?.toLowerCase().startsWith("faq")) {
      sections.push({ type: "faq", heading, body: block });
    } else if (heading?.toLowerCase() === "cta" || block.toLowerCase().includes("complementary cre data")) {
      sections.push({ type: "cta", heading, body: block });
    } else {
      sections.push({ type: "content", heading, body: block });
    }
  }

  return sections;
}

export function listInsightPosts() {
  const dir = path.join(ROOT, "content", "insights");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const { content, data } = readMarkdown(
      path.join("content", "insights", file)
    );
    const slug = String(
      data.slug ??
        file.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "")
    );
    return {
      file,
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      date: String(data.date ?? ""),
      category: String(data.category ?? ""),
      content,
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

export function getInsightBySlug(slug: string) {
  const posts = listInsightPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
