import type { Block } from "payload";

export const HeroBlock: Block = {
  slug: "hero",
  labels: { singular: "Hero Section", plural: "Hero Sections" },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "headingHighlight",
      type: "text",
      admin: { description: "Gradient-highlighted portion of the heading" },
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "secondaryText",
      type: "text",
      admin: { description: "Smaller sub-text below the description" },
    },
    {
      name: "calloutText",
      type: "text",
      admin: { description: "Blue callout box text (e.g. reframing line)" },
    },
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "buttons",
      type: "array",
      maxRows: 3,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
        {
          name: "style",
          type: "select",
          defaultValue: "primary",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Outline Light", value: "outline-light" },
            { label: "White", value: "white" },
          ],
        },
        {
          name: "isScheduleReview",
          type: "checkbox",
          defaultValue: false,
          admin: { description: "Opens the schedule review popup instead of linking" },
        },
      ],
    },
  ],
};
