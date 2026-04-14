import type { Block } from "payload";

export const FAQBlock: Block = {
  slug: "faq",
  labels: { singular: "FAQ Section", plural: "FAQ Sections" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
    },
    {
      name: "heading",
      type: "text",
    },
    {
      name: "groups",
      type: "array",
      fields: [
        { name: "groupLabel", type: "text" },
        {
          name: "items",
          type: "array",
          fields: [
            { name: "question", type: "text", required: true },
            { name: "answer", type: "richText", required: true },
          ],
        },
      ],
    },
  ],
};
