import Script from "next/script";
import { pageSchemaByPath } from "@/lib/schema";

interface SchemaJsonLdProps {
  path: string;
  extras?: Record<string, unknown>[];
}

export function SchemaJsonLd({ path, extras }: SchemaJsonLdProps) {
  const schemas = pageSchemaByPath(path, extras);
  return (
    <>
      {schemas.map((schema, idx) => (
        <Script
          key={idx}
          id={`schema-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  );
}
