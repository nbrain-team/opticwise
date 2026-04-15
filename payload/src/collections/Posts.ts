import type { CollectionConfig } from "payload";
import { ContentBlock } from "../blocks/Content";
import { CardGridBlock } from "../blocks/CardGrid";
import { CTABlock } from "../blocks/CTA";
import { FAQBlock } from "../blocks/FAQ";

export const Posts: CollectionConfig = {
  slug: "posts",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "status", "publishedAt"],
    description: "Blog / Insights articles.",
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "Short summary for cards and meta descriptions.",
      },
    },
    {
      name: "featureImage",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      hasMany: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "Additional category tags for filtering.",
      },
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "htmlContent",
      type: "textarea",
      admin: {
        description: "Legacy HTML content imported from Ghost. Used as fallback when rich text is empty.",
      },
    },
    {
      name: "layout",
      type: "blocks",
      admin: {
        description: "Optional layout blocks for rich blog posts. When present, these render below the main content.",
      },
      blocks: [ContentBlock, CardGridBlock, CTABlock, FAQBlock],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "readingTime",
      type: "number",
      admin: {
        position: "sidebar",
        description: "Estimated reading time in minutes.",
      },
    },
  ],
};
