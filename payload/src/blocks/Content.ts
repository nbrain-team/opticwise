import type { Block } from "payload";

export const ContentBlock: Block = {
  slug: "content",
  labels: { singular: "Rich Content", plural: "Rich Content Blocks" },
  fields: [
    {
      name: "layout",
      type: "select",
      defaultValue: "default",
      options: [
        { label: "Default (Full Width)", value: "default" },
        { label: "Narrow (Blog Width)", value: "narrow" },
        { label: "Two Column (Text + Image)", value: "two-column" },
      ],
    },
    {
      name: "eyebrow",
      type: "text",
      admin: { description: "Small uppercase label above heading (e.g. 'The Problem')" },
    },
    {
      name: "heading",
      type: "text",
    },
    {
      name: "richText",
      type: "richText",
      required: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        condition: (_, siblingData) => siblingData?.layout === "two-column",
        description: "Image shown beside the text in two-column layout",
      },
    },
    {
      name: "imagePosition",
      type: "select",
      defaultValue: "left",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.layout === "two-column",
      },
    },
    {
      name: "backgroundColor",
      type: "select",
      defaultValue: "white",
      options: [
        { label: "White", value: "white" },
        { label: "Light Gray", value: "gray" },
        { label: "Dark (Navy)", value: "dark" },
      ],
    },
  ],
};
