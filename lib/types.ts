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
  showOnHome: boolean;
}

export interface Post {
  id: string;
  categoryId: string;
  subtopicId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentMode?: "text" | "design";
  designHtml?: string;
  designCss?: string;
  designJs?: string;
  coverImage: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  publishedAt: string;
}

export interface HeroMediaItem {
  id: string;
  section: "video" | "image";
  title: string;
  source: string;
  order: number;
  enabled: boolean;
  redirectUrl?: string;
  updatedAt: string;
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
  role?: "admin" | "user";
  displayName?: string;
  dateOfBirth?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  isAdmin: boolean;
  role: "admin" | "user";
  displayName: string;
  dateOfBirth: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentMode?: "text" | "design";
  designHtml?: string;
  designCss?: string;
  designJs?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface ThirdPartyScript {
  id: string;
  name: string;
  src: string;
  inlineCode: string;
  location: "head" | "body";
  enabled: boolean;
  updatedAt: string;
}

export interface NavigationLink {
  id: string;
  label: string;
  href: string;
  location: "header" | "footer";
  order: number;
  parentId?: string;
  enabled: boolean;
  openInNewTab: boolean;
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
  type: "post_view" | "pdf_download" | "feedback" | "post_share";
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
  themeMode: "light" | "dark";
  layoutSideGap: number;
  heroVideoSliderEnabled: boolean;
  heroImageSliderEnabled: boolean;
  logoMode: "text" | "image";
  logoImageUrl: string;
  logoSize: number;
  logoTitleLine1: string;
  logoTitleLine2: string;
  logoAccentText: string;
  communityApprovalEnabled: boolean;
  contentPreviewEnabled: boolean;
  contentPreviewPercent: number;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage: string;
  siteUrl: string;
  robotsIndexable: boolean;
  geminiEnabled: boolean;
  geminiModel: string;
  notFoundRedirectType: "home" | "custom";
  notFoundRedirectPath: string;
  notFoundButtonLabel: string;
  updatedAt: string;
}

export interface Webinar {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerImage: string;
  startAt: string;
  endAt: string;
  meetingUrl: string;
  shortcode: string;
  isPublished: boolean;
  showOnHome: boolean;
  showPublicPage: boolean;
  updatedAt: string;
}

export interface WebinarRegistration {
  id: string;
  webinarId: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface CourseQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface CourseType {
  id: string;
  name: string;
  slug: string;
  order: number;
  enabled: boolean;
  updatedAt: string;
}

export type CourseAdType = "image" | "video" | "code";

export interface CourseAd {
  id: string;
  name: string;
  type: CourseAdType;
  title: string;
  source: string;
  redirectUrl: string;
  code: string;
  enabled: boolean;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  typeSlug: string;
  templateId?: string;
  lessons: CourseLesson[];
  passingScore: number;
  questions: CourseQuestion[];
  adsEnabled: boolean;
  adIds: string[];
  customLandingEnabled?: boolean;
  customLandingSlug?: string;
  landingHtml?: string;
  landingCss?: string;
  landingJs?: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface UserCourseProgress {
  id: string;
  courseId: string;
  userId: string;
  userEmail: string;
  completedLessonIds: string[];
  testUnlocked: boolean;
  testPassed: boolean;
  score: number;
  testAttempts: number;
  certificateId?: string;
  updatedAt: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  signatureImage: string;
  enabled: boolean;
  updatedAt: string;
}

export interface UserCertificate {
  id: string;
  courseId: string;
  userId: string;
  userEmail: string;
  userName: string;
  templateId: string;
  issuedAt: string;
  certificateNumber: string;
  score: number;
  attempts: number;
  totalQuestions: number;
  passingScore: number;
}

export interface PostAnalyticsBreakdown {
  postId: string;
  title: string;
  views: number;
  downloads: number;
  shares: number;
}

export interface AnalyticsSummary {
  activeUsers: number;
  views: number;
  downloads: number;
  shares: number;
  feedbackCount: number;
}
export interface CommunityCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  enabled: boolean;
  updatedAt: string;
}

export type CommunityStatus = "approved" | "pending" | "rejected";

export interface CommunityQuestion {
  id: string;
  categoryId: string;
  authorName: string;
  authorEmail: string;
  authorUserId: string;
  question: string;
  status: CommunityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityAnswer {
  id: string;
  questionId: string;
  categoryId: string;
  authorName: string;
  authorEmail: string;
  authorUserId: string;
  answer: string;
  status: CommunityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  order: number;
  enabled: boolean;
  showInFooter: boolean;
  showFloating: boolean;
  updatedAt: string;
}

export interface VisitorEvent {
  id: string;
  visitorId: string;
  country: string;
  firstVisitedAt: string;
  lastVisitedAt: string;
  lastPath: string;
}

export interface VisitorAnalyticsSummary {
  totalVisitors: number;
  byDate: Array<{ date: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
}




export interface LandingTopic {
  id: string;
  title: string;
  slug: string;
  description: string;
  html: string;
  css: string;
  js: string;
  showOnHome: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showTitle: boolean;
  showDescription: boolean;
  showBreadcrumb: boolean;
  showActionButton: boolean;
  actionButtonLabel: string;
  actionButtonUrl: string;
  isPublished: boolean;
  updatedAt: string;
}





