import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import sharp from "sharp";

import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Users } from "./collections/Users";
import { SiteSettings } from "./globals/SiteSettings";
import { Navigation } from "./globals/Navigation";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Posts, Media, Categories, Users],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "CHANGE-ME-PLEASE",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
    push: true,
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ["pages", "posts"],
      uploadsCollection: "media",
      generateTitle: ({ doc }: any) => `${doc?.title || "OpticWise"} | OpticWise`,
      generateDescription: ({ doc }: any) => doc?.excerpt || "",
    }),
  ],
});
