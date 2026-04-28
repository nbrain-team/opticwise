import type { Block } from "payload";

/**
 * FormEmbed — render a form authored in the OpticWise platform on any page.
 *
 * The actual fields, labels, mapping, pipeline routing, and deal owner all
 * live in the OpticWise platform (https://ownet.opticwise.com). This block
 * just references the form by its `formSlug` and the Payload renderer fetches
 * the live definition at view time.
 */
export const FormEmbedBlock: Block = {
  slug: "formEmbed",
  labels: { singular: "Form Embed", plural: "Form Embeds" },
  fields: [
    {
      name: "formSlug",
      label: "Form slug",
      type: "text",
      required: true,
      admin: {
        description:
          "The slug of the form created in the OpticWise platform (Forms → choose form → Slug). e.g. 'demo-request'",
      },
    },
    {
      name: "eyebrow",
      type: "text",
      admin: {
        description: "Optional small label shown above the heading.",
      },
    },
    {
      name: "heading",
      type: "text",
      admin: {
        description: "Optional heading shown above the form. Leave empty to show the form's own name.",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Optional intro copy shown above the form.",
      },
    },
    {
      name: "theme",
      type: "select",
      defaultValue: "light",
      options: [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
      ],
    },
    {
      name: "alignment",
      type: "select",
      defaultValue: "center",
      options: [
        { label: "Centered", value: "center" },
        { label: "Left", value: "left" },
      ],
    },
  ],
};
