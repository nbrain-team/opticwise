export function getMediaUrl(media: any): string {
  if (!media) return "";
  if (typeof media === "string") return media;
  return media.url || "";
}

export function getMediaAlt(media: any): string {
  if (!media) return "";
  if (typeof media === "string") return "";
  return media.alt || "";
}
