import type { Block } from "payload";

export const CTABlock: Block = {
  slug: "cta",
  labels: { singular: "Call to Action", plural: "CTAs" },
  fields: [
    {
      name: "style",
      type: "select",
      defaultValue: "primary",
      options: [
        { label: "Primary (Blue overlay with background image)", value: "primary" },
        { label: "Dark (Navy background)", value: "dark" },
        { label: "Simple (Closing strip)", value: "simple" },
      ],
    },
    {
      name: "eyebrow",
      type: "text",
    },
    {
      name: "heading",
      type: "text",
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        condition: (_, siblingData) => siblingData?.style === "primary",
      },
    },
    {
      name: "buttonLabel",
      type: "text",
    },
    {
      name: "buttonHref",
      type: "text",
    },
    {
      name: "isScheduleReview",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Button opens schedule review popup" },
    },
  ],
};
