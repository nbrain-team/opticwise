export interface PackageMetadata {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  featureImagePrompt: string;
  ogImagePrompt: string;
}

export interface AuthorPackage {
  author: 'bill' | 'drew';
  slug: string;
  metadata: PackageMetadata;
  blogMarkdown: string;
  blogWordCount: number;
  linkedinArticleMarkdown: string;
  linkedinArticleWordCount: number;
  linkedinShortPost: {
    text: string;
    hashtags: string[];
  };
}
