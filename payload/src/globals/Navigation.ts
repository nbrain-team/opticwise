import type { GlobalConfig } from "payload";

export const Navigation: GlobalConfig = {
  slug: "navigation",
  label: "Navigation",
  admin: {
    description: "Site header navigation, footer links, pillars, and products.",
  },
  fields: [
    {
      name: "mainNav",
      type: "array",
      label: "Main Navigation",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
    },
    {
      name: "pillars",
      type: "array",
      label: "Pillars (Footer Explore)",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
        { name: "desc", type: "text" },
      ],
    },
    {
      name: "products",
      type: "array",
      label: "Products & Services (Footer)",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
    },
  ],
};
