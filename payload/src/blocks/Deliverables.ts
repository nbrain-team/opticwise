import type { Block } from "payload";

export const DeliverablesBlock: Block = {
  slug: "deliverables",
  labels: { singular: "Deliverables List", plural: "Deliverables Lists" },
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
      name: "backgroundColor",
      type: "select",
      defaultValue: "gray",
      options: [
        { label: "White", value: "white" },
        { label: "Light Gray", value: "gray" },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "subtitle", type: "text" },
        { name: "description", type: "textarea" },
        {
          name: "bulletPoints",
          type: "array",
          fields: [{ name: "text", type: "text", required: true }],
        },
      ],
    },
  ],
};
