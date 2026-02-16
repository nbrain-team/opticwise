import { SITE } from "./site";
type AnyObj = Record<string, unknown>;

export function orgSchema(): AnyObj {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

export function websiteSchema(): AnyObj {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
  };
}

export function pageSchemaByPath(
  pagePath: string,
  extras?: AnyObj[]
): AnyObj[] {
  const base: AnyObj[] = [orgSchema(), websiteSchema()];
  const add = (obj: AnyObj) => base.push(obj);
  const addAll = (arr?: AnyObj[]) => arr?.forEach(add);

  if (pagePath === "/") {
    add({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Homepage",
    });
  } else if (pagePath === "/insights/") {
    add({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Insights",
    });
    add({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Insights Index",
    });
  } else if (pagePath.startsWith("/insights/")) {
    add({ "@context": "https://schema.org", "@type": "BlogPosting" });
  } else if (pagePath === "/faq/") {
    add({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "FAQ",
    });
  } else if (pagePath === "/ppp-audit/") {
    add({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "PPP Audit™",
    });
    add({ "@context": "https://schema.org", "@type": "WebPage" });
  } else if (
    pagePath === "/bot-building-of-things/" ||
    pagePath === "/5s-wireless-connectivity/"
  ) {
    add({ "@context": "https://schema.org", "@type": "Product" });
    add({ "@context": "https://schema.org", "@type": "WebPage" });
  } else {
    add({ "@context": "https://schema.org", "@type": "WebPage" });
    add({ "@context": "https://schema.org", "@type": "Article" });
  }

  addAll(extras);
  return base;
}
