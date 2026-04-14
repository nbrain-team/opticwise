import type { Block } from "payload";

export const CardGridBlock: Block = {
  slug: "cardGrid",
  labels: { singular: "Card Grid", plural: "Card Grids" },
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
      name: "columns",
      type: "select",
      defaultValue: "3",
      options: [
        { label: "2 Columns", value: "2" },
        { label: "3 Columns", value: "3" },
        { label: "4 Columns", value: "4" },
      ],
    },
    {
      name: "style",
      type: "select",
      defaultValue: "light",
      options: [
        { label: "Light Background", value: "light" },
        { label: "White Background", value: "white" },
        { label: "Dark Background", value: "dark" },
      ],
    },
    {
      name: "cards",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "icon", type: "select", options: [
          { label: "Chart Up", value: "chart-up" },
          { label: "Users", value: "users" },
          { label: "Shield", value: "shield" },
          { label: "Lightbulb", value: "lightbulb" },
          { label: "Flask", value: "flask" },
          { label: "Building", value: "building" },
          { label: "Network", value: "network" },
          { label: "Lock", value: "lock" },
          { label: "Globe", value: "globe" },
          { label: "Wifi", value: "wifi" },
          { label: "Data", value: "data" },
          { label: "Brain", value: "brain" },
        ]},
        { name: "iconColor", type: "select", defaultValue: "blue", options: [
          { label: "Blue", value: "blue" },
          { label: "Green", value: "green" },
          { label: "Red", value: "red" },
          { label: "Amber", value: "amber" },
          { label: "Purple", value: "purple" },
        ]},
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "href", type: "text", admin: { description: "Optional link URL" } },
        { name: "image", type: "upload", relationTo: "media" },
      ],
    },
    {
      name: "footnote",
      type: "text",
      admin: { description: "Italic text below the card grid" },
    },
  ],
};
