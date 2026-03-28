export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface Subtopic {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  order: number;
}

export interface Post {
  id: string;
  categoryId: string;
  subtopicId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  publishedAt: string;
}

export interface Feedback {
  id: string;
  postId: string;
  userId: string;
  userEmail: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  email: string;
  topicId?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface ThirdPartyScript {
  id: string;
  name: string;
  src: string;
  location: "head" | "body";
  enabled: boolean;
  updatedAt: string;
}

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  target: "website" | "topic";
  topicId?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: "post_view" | "pdf_download" | "feedback";
  postId?: string;
  userId?: string;
  createdAt: string;
}

export interface LivePresence {
  id: string;
  userId: string;
  email?: string;
  sessionId: string;
  lastSeenAt: string;
}

export interface SiteSettings {
  id: string;
  liveTrackingEnabled: boolean;
  updatedAt: string;
}

export interface AnalyticsSummary {
  activeUsers: number;
  views: number;
  downloads: number;
  feedbackCount: number;
}
