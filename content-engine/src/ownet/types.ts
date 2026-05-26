export interface InsightsScheduleRequest {
  author: 'bill' | 'drew';
  author_display_name: string;
  title: string;
  slug: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  category: string;
  tags: string[];
  reading_time_minutes: number;
  publish_at: string;
  body_html: string;
  feature_image_url: string;
  og_image_url: string;
  source_doc_url: string;
  run_id: string;
}

export interface InsightsScheduleResponse {
  scheduled_post_id: string;
  status: 'scheduled';
  publish_at: string;
  edit_url: string;
  preview_url: string;
}

export interface SocialComposeRequest {
  author: 'bill' | 'drew';
  channel: 'linkedin';
  target_profile: string;
  text: string;
  hashtags: string[];
  publish_at: string;
  source_blog_post_id: string;
  run_id: string;
}

export interface SocialComposeResponse {
  social_post_id: string;
  status: 'scheduled';
  publish_at: string;
  channel: string;
  target_profile: string;
  edit_url: string;
}
