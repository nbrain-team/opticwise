import type { Block } from "payload";

export const LeadMagnetBlock: Block = {
  slug: "leadMagnet",
  labels: { singular: "Lead Magnet Section", plural: "Lead Magnet Sections" },
  fields: [
    {
      name: "badge",
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
      name: "bulletPoints",
      type: "array",
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "bookImage",
      type: "upload",
      relationTo: "media",
    },
  ],
};
