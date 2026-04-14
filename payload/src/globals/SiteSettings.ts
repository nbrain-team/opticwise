import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: {
    description: "Global site configuration — branding, CTA defaults, footer text.",
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      defaultValue: "OpticWise",
    },
    {
      name: "siteUrl",
      type: "text",
      defaultValue: "https://opticwise.com",
    },
    {
      name: "reframingLine",
      type: "text",
      defaultValue: "If you don't own your data & digital infrastructure, your vendors do.",
    },
    {
      name: "closingLine",
      type: "text",
      defaultValue: "Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game.",
    },
    {
      name: "primaryCTA",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
          defaultValue: "Complementary CRE Data & Digital Review Session",
        },
        {
          name: "microcopy",
          type: "text",
          defaultValue: "One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs.",
        },
        {
          name: "href",
          type: "text",
          defaultValue: "/ppp-audit/",
        },
      ],
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "footerDescription",
      type: "text",
      defaultValue: "Owner-controlled data & digital infrastructure for commercial real estate.",
    },
  ],
};
