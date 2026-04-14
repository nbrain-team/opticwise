import type { Block } from "payload";

export const TwoLayerModelBlock: Block = {
  slug: "twoLayerModel",
  labels: { singular: "Two-Layer Model", plural: "Two-Layer Models" },
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
      name: "description",
      type: "richText",
    },
    {
      name: "layer1",
      type: "group",
      fields: [
        { name: "tag", type: "text", defaultValue: "Layer 1" },
        { name: "title", type: "text" },
        { name: "subtitle", type: "text" },
        {
          name: "items",
          type: "array",
          fields: [
            { name: "bold", type: "text" },
            { name: "text", type: "text" },
          ],
        },
      ],
    },
    {
      name: "layer2",
      type: "group",
      fields: [
        { name: "tag", type: "text", defaultValue: "Layer 2" },
        { name: "title", type: "text" },
        { name: "subtitle", type: "text" },
        { name: "description", type: "richText" },
        {
          name: "formula",
          type: "array",
          fields: [{ name: "step", type: "text" }],
        },
      ],
    },
  ],
};
