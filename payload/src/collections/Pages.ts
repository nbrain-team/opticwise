import type { CollectionConfig } from "payload";
import { HeroBlock } from "../blocks/Hero";
import { ContentBlock } from "../blocks/Content";
import { CardGridBlock } from "../blocks/CardGrid";
import { CTABlock } from "../blocks/CTA";
import { TwoLayerModelBlock } from "../blocks/TwoLayerModel";
import { LeadMagnetBlock } from "../blocks/LeadMagnet";
import { FAQBlock } from "../blocks/FAQ";
import { TimelineBlock } from "../blocks/Timeline";
import { DeliverablesBlock } from "../blocks/Deliverables";

export const Pages: CollectionConfig = {
  slug: "pages",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
    description: "Website pages with block-based layout builder.",
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
        description: "URL path for this page (e.g. 'ppp-audit')",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "Short description shown in hero sections and meta tags.",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
        description: "Background image for the page hero.",
      },
    },
    {
      name: "heroBadge",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Optional badge shown above the hero title.",
      },
    },
    {
      name: "isHomePage",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Mark this as the home page (only one should be checked).",
      },
    },
    {
      name: "layout",
      type: "blocks",
      blocks: [
        HeroBlock,
        ContentBlock,
        CardGridBlock,
        CTABlock,
        TwoLayerModelBlock,
        LeadMagnetBlock,
        FAQBlock,
        TimelineBlock,
        DeliverablesBlock,
      ],
    },
  ],
};
