import type { Block } from "payload";

export const TimelineBlock: Block = {
  slug: "timeline",
  labels: { singular: "Timeline / Process Steps", plural: "Timelines" },
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
      name: "subheading",
      type: "textarea",
    },
    {
      name: "backgroundColor",
      type: "select",
      defaultValue: "white",
      options: [
        { label: "White", value: "white" },
        { label: "Light Gray", value: "gray" },
        { label: "Dark", value: "dark" },
      ],
    },
    {
      name: "steps",
      type: "array",
      required: true,
      fields: [
        { name: "number", type: "text", required: true },
        { name: "title", type: "text", required: true },
        { name: "badge", type: "text" },
        { name: "description", type: "textarea" },
        { name: "isActive", type: "checkbox", defaultValue: false },
      ],
    },
  ],
};
