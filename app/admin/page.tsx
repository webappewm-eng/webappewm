"use client";

import JSZip from "jszip";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RichPostEditor } from "@/components/editor/RichPostEditor";
import { DesignStudio } from "@/components/editor/DesignStudio";
import { uploadPostImage, uploadSiteAsset } from "@/lib/firebase/storage";
import {
  createCategory,
  createCommunityCategory,
  createCommunityQuestion,
  createCommunityAnswer,
  createCustomPage,
  createHeroMedia,
  createNotification,
  createNavigationLink,
  createSocialLink,
  createPost,
  createSubtopic,
  createThirdPartyScript,
  createWebinar,
  createCourse,
  createCourseType,
  createCourseAd,
  createCertificateTemplate,
  createLandingTopic,
  deleteCategory,
  deleteCommunityAnswer,
  deleteCommunityCategory,
  deleteCommunityQuestion,
  deleteCustomPage,
  deleteHeroMedia,
  deleteNavigationLink,
  deleteSocialLink,
  deletePost,
  deleteSubtopic,
  deleteThirdPartyScript,
  deleteWebinar,
  deleteCourse,
  deleteCourseType,
  deleteCourseAd,
  deleteCertificateTemplate,
  deleteLandingTopic,
  getAnalyticsSummary,
  getCommunityAnswersForAdmin,
  getCommunityCategoriesForAdmin,
  getCommunityQuestionsForAdmin,
  getCategories,
  getCustomPages,
  getFeedback,
  getPostAnalyticsBreakdown,
  getHeroMediaForAdmin,
  getNotifications,
  getNavigationLinksForAdmin,
  getSocialLinksForAdmin,
  seedDefaultSocialLinks,
  getPosts,
  getSiteSettings,
  getSubtopics,
  getThirdPartyScripts,
  getVisitorAnalytics,
  getWebinars,
  getWebinarRegistrations,
  getCourses,
  getCourseTypesForAdmin,
  getCourseAdsForAdmin,
  getCourseProgressForAdmin,
  getCertificateTemplates,
  getCertificatesForAdmin,
  getLandingTopics,
  listSubscriptions,
  updateCategory,
  updateCommunityAnswerStatus,
  updateCommunityCategory,
  updateCommunityQuestionStatus,
  updateCustomPage,
  updateHeroMedia,
  updateLiveTracking,
  updateNavigationLink,
  updateSocialLink,
  updateNotFoundSettings,
  updatePost,
  updateSiteAppearanceSettings,
  updateSubtopic,
  updateThirdPartyScript,
  updateWebinar,
  updateCourse,
  updateCourseType,
  updateCourseAd,
  updateCertificateTemplate,
  updateLandingTopic
} from "@/lib/firebase/data";
import {
  AnalyticsSummary,
  Category,
  CommunityAnswer,
  CommunityCategory,
  CommunityQuestion,
  CommunityStatus,
  CustomPage,
  Feedback,
  HeroMediaItem,
  NavigationLink,
  NotificationMessage,
  Post,
  PostAnalyticsBreakdown,
  SiteSettings,
  SocialLink,
  Subscription,
  Subtopic,
  ThirdPartyScript,
  Webinar,
  WebinarRegistration,
  Course,
  CourseType,
  CourseAd,
  UserCourseProgress,
  CertificateTemplate,
  LandingTopic,
  UserCertificate,
  VisitorAnalyticsSummary
} from "@/lib/types";
const emptyPostForm = {
  title: "",
  slug: "",
  excerpt: "",
  contentMode: "text" as "text" | "design",
  content: "",
  designHtml: "",
  designCss: "",
  designJs: "",
  coverImage: "",
  categoryId: "",
  subtopicId: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  isPublished: true,
  publishedAt: new Date().toISOString().slice(0, 10)
};

const emptyPageForm = {
  title: "",
  slug: "",
  contentMode: "text" as "text" | "design",
  content: "",
  designHtml: "",
  designCss: "",
  designJs: "",
  showHeader: true,
  showFooter: true,
  seoTitle: "",
  seoDescription: "",
  isPublished: true
};

const emptyWebinarForm = {
  title: "",
  slug: "",
  description: "",
  bannerImage: "",
  startAt: "",
  endAt: "",
  meetingUrl: "",
  isPublished: true,
  showOnHome: true,
  showPublicPage: true
};

const emptyCourseForm = {
  title: "",
  slug: "",
  description: "",
  coverImage: "",
  typeSlug: "",
  templateId: "",
  passingScore: "70",
  lessonsInput: "",
  questionsInput: "",
  adsEnabled: false,
  adIds: [] as string[],
  isPublished: true
};

const emptyCourseTypeForm = {
  name: "",
  slug: "",
  enabled: true
};

const emptyCourseAdForm = {
  name: "",
  type: "image" as CourseAd["type"],
  title: "",
  source: "",
  redirectUrl: "",
  code: "",
  enabled: true
};

const emptyTemplateForm = {
  name: "",
  backgroundImage: "",
  signatureImage: "",
  enabled: true
};

const emptyLandingTopicForm = {
  title: "",
  slug: "",
  html: "",
  css: "",
  js: "",
  showHeader: true,
  showFooter: true,
  isPublished: true
};

const emptyCommunityCategoryForm = {
  name: "",
  slug: "",
  description: "",
  enabled: true
};

const emptySocialForm = {
  platform: "youtube",
  label: "",
  url: "",
  order: "1",
  enabled: true,
  showInFooter: true,
  showFloating: true
};
interface HeroDraftRow {
  id: string;
  section: HeroMediaItem["section"];
  title: string;
  source: string;
  redirectUrl: string;
}

function createHeroDraftRow(section: HeroMediaItem["section"] = "image"): HeroDraftRow {
  return {
    id: `hero-row-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    section,
    title: "",
    source: "",
    redirectUrl: ""
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseLessonsInput(raw: string): Course["lessons"] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [titleRaw, ...contentParts] = line.split("::");
      const title = titleRaw?.trim() || `Lesson ${index + 1}`;
      const content = contentParts.join("::").trim() || "Add lesson content";
      return {
        id: `lesson-${index + 1}`,
        title,
        content,
        order: index + 1
      };
    });
}

function parseQuestionsInput(raw: string): Course["questions"] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [questionRaw, optionsRaw, correctRaw] = line.split("||");
      const options = (optionsRaw ?? "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);

      return {
        question: (questionRaw ?? "Question").trim(),
        options: options.length ? options : ["Option A", "Option B"],
        correctOptionIndex: Math.min(options.length ? options.length - 1 : 0, Math.max(0, Number(correctRaw ?? "0") || 0))
      };
    });
}

function lessonsToInput(lessons: Course["lessons"]): string {
  return lessons
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((lesson) => `${lesson.title}::${lesson.content}`)
    .join("\n");
}

function questionsToInput(questions: Course["questions"]): string {
  return questions
    .map((question) => `${question.question}||${question.options.join("|")}||${question.correctOptionIndex}`)
    .join("\n");
}


interface CourseSectionDraft {
  id: string;
  title: string;
  content: string;
}

interface CourseQuestionDraft {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOptionIndex: number;
}

function createCourseSectionDraft(partial?: Partial<Omit<CourseSectionDraft, "id">>): CourseSectionDraft {
  return {
    id: `course-section-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: partial?.title ?? "New Section",
    content: partial?.content ?? "Add section content"
  };
}

function createCourseQuestionDraft(partial?: Partial<Omit<CourseQuestionDraft, "id">>): CourseQuestionDraft {
  return {
    id: `course-question-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    question: partial?.question ?? "",
    optionA: partial?.optionA ?? "Option A",
    optionB: partial?.optionB ?? "Option B",
    optionC: partial?.optionC ?? "",
    optionD: partial?.optionD ?? "",
    correctOptionIndex: partial?.correctOptionIndex ?? 0
  };
}

function lessonsToSectionDrafts(lessons: Course["lessons"]): CourseSectionDraft[] {
  if (!lessons.length) {
    return [createCourseSectionDraft()];
  }

  return lessons
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((lesson) =>
      createCourseSectionDraft({
        title: lesson.title,
        content: lesson.content
      })
    );
}

function questionsToQuestionDrafts(questions: Course["questions"]): CourseQuestionDraft[] {
  if (!questions.length) {
    return [createCourseQuestionDraft()];
  }

  return questions.map((question) => {
    const optionA = question.options[0] ?? "Option A";
    const optionB = question.options[1] ?? "Option B";
    const optionC = question.options[2] ?? "";
    const optionD = question.options[3] ?? "";

    return createCourseQuestionDraft({
      question: question.question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOptionIndex: question.correctOptionIndex
    });
  });
}

function sectionDraftsToInput(rows: CourseSectionDraft[]): string {
  return rows
    .map((row) => `${row.title.trim() || "New Section"}::${row.content.trim() || "Add section content"}`)
    .join("\n");
}

function questionDraftsToInput(rows: CourseQuestionDraft[]): string {
  return rows
    .map((row) => {
      const options = [row.optionA, row.optionB, row.optionC, row.optionD]
        .map((item) => item.trim())
        .filter(Boolean);
      const safeOptions = options.length ? options : ["Option A", "Option B"];
      const correct = Math.min(safeOptions.length - 1, Math.max(0, Number(row.correctOptionIndex) || 0));
      return `${row.question.trim() || "Question"}||${safeOptions.join("|")}||${correct}`;
    })
    .join("\n");
}
function parseCourseSectionsCsv(raw: string): Course["lessons"] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const rows = lines.map((line) =>
    line
      .split(",")
      .map((value) => value.trim().replace(/^"|"$/g, ""))
  );

  const maybeHeader = rows[0].map((item) => item.toLowerCase());
  const hasHeader = maybeHeader.includes("title") || maybeHeader.includes("section") || maybeHeader.includes("content");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row, index) => {
      const title = (row[0] ?? "").trim() || `Section ${index + 1}`;
      const content = (row[1] ?? "").trim() || "Add section content";
      return {
        id: `lesson-${index + 1}`,
        title,
        content,
        order: index + 1
      };
    })
    .filter((item) => item.title || item.content);
}

async function parseCourseSectionsSpreadsheet(file: File): Promise<Course["lessons"]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    return parseCourseSectionsCsv(await file.text());
  }

  if (!fileName.endsWith(".xlsx")) {
    throw new Error("Unsupported format");
  }

  const zip = await JSZip.loadAsync(file);
  const sheet = zip.file("xl/worksheets/sheet1.xml");
  if (!sheet) {
    return [];
  }

  const sharedStringsFile = zip.file("xl/sharedStrings.xml");
  const parser = new DOMParser();
  const sharedStrings: string[] = [];

  if (sharedStringsFile) {
    const sharedXml = await sharedStringsFile.async("text");
    const sharedDoc = parser.parseFromString(sharedXml, "application/xml");
    Array.from(sharedDoc.getElementsByTagName("si")).forEach((item) => {
      const parts = Array.from(item.getElementsByTagName("t")).map((node) => node.textContent ?? "");
      sharedStrings.push(parts.join(""));
    });
  }

  const sheetXml = await sheet.async("text");
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");
  const rows = Array.from(sheetDoc.getElementsByTagName("row"));
  const values: string[][] = rows.map((row) => {
    const cells = Array.from(row.getElementsByTagName("c"));
    return cells.map((cell) => {
      const type = cell.getAttribute("t") ?? "";
      if (type === "inlineStr") {
        return cell.getElementsByTagName("t")[0]?.textContent?.trim() ?? "";
      }
      const rawValue = cell.getElementsByTagName("v")[0]?.textContent?.trim() ?? "";
      if (type === "s") {
        const idx = Number(rawValue);
        return Number.isFinite(idx) ? sharedStrings[idx] ?? "" : "";
      }
      return rawValue;
    });
  });

  if (!values.length) {
    return [];
  }

  const maybeHeader = values[0].map((item) => item.toLowerCase());
  const hasHeader = maybeHeader.includes("title") || maybeHeader.includes("section") || maybeHeader.includes("content");
  const dataRows = hasHeader ? values.slice(1) : values;

  return dataRows
    .map((row, index) => {
      const title = (row[0] ?? "").trim() || `Section ${index + 1}`;
      const content = (row[1] ?? "").trim() || "Add section content";
      return {
        id: `lesson-${index + 1}`,
        title,
        content,
        order: index + 1
      };
    })
    .filter((item) => item.title || item.content);
}

function downloadSampleCourseSectionsFile(): void {
  if (typeof window === "undefined") {
    return;
  }
  const csv = "title,content\nSection 1,Intro content\nSection 2,Second section content";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "course-sections-sample.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

type AdminTabKey = "general" | "category" | "topics" | "pages" | "seo" | "learning" | "engagement";

const adminTabs: { key: AdminTabKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "seo", label: "SEO & Settings" },
  { key: "topics", label: "Topics" },
  { key: "pages", label: "Pages" },
  { key: "learning", label: "Learning" },
  { key: "engagement", label: "Engagement" }
];
export default function AdminPage() {
  const { profile, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [landingTopics, setLandingTopics] = useState<LandingTopic[]>([]);
  const [scripts, setScripts] = useState<ThirdPartyScript[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    activeUsers: 0,
    views: 0,
    downloads: 0,
    shares: 0,
    feedbackCount: 0
  });
  const [postAnalytics, setPostAnalytics] = useState<PostAnalyticsBreakdown[]>([]);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [webinarRegistrations, setWebinarRegistrations] = useState<WebinarRegistration[]>([]);
  const [coursesData, setCoursesData] = useState<Course[]>([]);
  const [courseTypesData, setCourseTypesData] = useState<CourseType[]>([]);
  const [courseAdsData, setCourseAdsData] = useState<CourseAd[]>([]);
  const [courseProgress, setCourseProgress] = useState<UserCourseProgress[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [communityCategories, setCommunityCategories] = useState<CommunityCategory[]>([]);
  const [communityQuestions, setCommunityQuestions] = useState<CommunityQuestion[]>([]);
  const [communityAnswers, setCommunityAnswers] = useState<CommunityAnswer[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [visitorAnalytics, setVisitorAnalytics] = useState<VisitorAnalyticsSummary>({
    totalVisitors: 0,
    byDate: [],
    byCountry: []
  });

  const [settings, setSettings] = useState<SiteSettings>({
    id: "global",
    liveTrackingEnabled: true,
    themeMode: "light",
    layoutSideGap: 32,
    heroVideoSliderEnabled: false,
    heroImageSliderEnabled: false,
    logoMode: "text",
    logoImageUrl: "",
    logoSize: 38,
    logoTitleLine1: "Engineer",
    logoTitleLine2: "With",
    logoAccentText: "Me",
    communityApprovalEnabled: true,
    contentPreviewEnabled: true,
    contentPreviewPercent: 20,
    defaultSeoTitle: "Engineer With Me",
    defaultSeoDescription: "Real Build. Real Code. Real Engineering.",
    defaultOgImage: "",
    siteUrl: "https://webappewm.vercel.app",
    robotsIndexable: true,
    geminiEnabled: false,
    geminiModel: "gemini-1.5-flash",
    notFoundRedirectType: "home",
    notFoundRedirectPath: "/",
    notFoundButtonLabel: "Go to Home",
    updatedAt: new Date().toISOString()
  });

  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [categoryEditingId, setCategoryEditingId] = useState("");

  const [subtopicForm, setSubtopicForm] = useState({ categoryId: "", name: "", slug: "", showOnHome: true });
  const [subtopicEditingId, setSubtopicEditingId] = useState("");

  const [postForm, setPostForm] = useState(emptyPostForm);
  const [postEditingId, setPostEditingId] = useState("");

  const [pageForm, setPageForm] = useState(emptyPageForm);
  const [pageEditingId, setPageEditingId] = useState("");

  const [landingTopicForm, setLandingTopicForm] = useState(emptyLandingTopicForm);
  const [landingTopicEditingId, setLandingTopicEditingId] = useState("");

  const [scriptForm, setScriptForm] = useState({ name: "", src: "", inlineCode: "", location: "body" as "head" | "body" });
  const [heroMedia, setHeroMedia] = useState<HeroMediaItem[]>([]);
  const [heroForm, setHeroForm] = useState({
    section: "image" as HeroMediaItem["section"],
    title: "",
    source: "",
    redirectUrl: "",
    order: "1",
    enabled: true
  });
  const [heroDraftRows, setHeroDraftRows] = useState<HeroDraftRow[]>([createHeroDraftRow("image")]);
  const [heroBulkRedirectLinks, setHeroBulkRedirectLinks] = useState("");
  const [heroEditingId, setHeroEditingId] = useState("");

  const [appearanceForm, setAppearanceForm] = useState({
    themeMode: "light" as SiteSettings["themeMode"],
    layoutSideGap: "32",
    heroVideoSliderEnabled: false,
    heroImageSliderEnabled: false,
    logoMode: "text" as SiteSettings["logoMode"],
    logoImageUrl: "",
    logoSize: "38",
    logoTitleLine1: "Engineer",
    logoTitleLine2: "With",
    logoAccentText: "Me",
    communityApprovalEnabled: true,
    contentPreviewEnabled: true,
    contentPreviewPercent: "20",
    defaultSeoTitle: "Engineer With Me",
    defaultSeoDescription: "Real Build. Real Code. Real Engineering.",
    defaultOgImage: "",
    siteUrl: "https://webappewm.vercel.app",
    robotsIndexable: true,
    geminiEnabled: false,
    geminiModel: "gemini-1.5-flash"
  });

  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", target: "website" as "website" | "topic", topicId: "" });

  const [navForm, setNavForm] = useState({
    label: "",
    href: "",
    location: "header" as NavigationLink["location"],
    order: "1",
    parentId: "",
    enabled: true,
    openInNewTab: false
  });
  const [navEditingId, setNavEditingId] = useState("");

  const [communityCategoryForm, setCommunityCategoryForm] = useState(emptyCommunityCategoryForm);
  const [communityCategoryEditingId, setCommunityCategoryEditingId] = useState("");

  const [socialForm, setSocialForm] = useState(emptySocialForm);
  const [socialEditingId, setSocialEditingId] = useState("");

  const [notFoundForm, setNotFoundForm] = useState({
    notFoundRedirectType: "home" as SiteSettings["notFoundRedirectType"],
    notFoundRedirectPath: "/",
    notFoundButtonLabel: "Go to Home"
  });

  const [webinarForm, setWebinarForm] = useState(emptyWebinarForm);
  const [webinarEditingId, setWebinarEditingId] = useState("");

  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [courseEditingId, setCourseEditingId] = useState("");
  const [courseSectionDrafts, setCourseSectionDrafts] = useState<CourseSectionDraft[]>([createCourseSectionDraft()]);
  const [courseQuestionDrafts, setCourseQuestionDrafts] = useState<CourseQuestionDraft[]>([createCourseQuestionDraft()]);
  const [courseTypeForm, setCourseTypeForm] = useState(emptyCourseTypeForm);
  const [courseTypeEditingId, setCourseTypeEditingId] = useState("");
  const [courseAdForm, setCourseAdForm] = useState(emptyCourseAdForm);
  const [courseAdEditingId, setCourseAdEditingId] = useState("");

  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [templateEditingId, setTemplateEditingId] = useState("");

  const [status, setStatus] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabKey>("general");

  function isTabActive(tab: AdminTabKey): boolean {
    return activeTab === tab;
  }

  const refreshAll = useCallback(async () => {
    const [
      nextCategories,
      nextSubtopics,
      nextPosts,
      nextFeedback,
      nextPages,
      nextLandingTopics,
      nextScripts,
      nextHeroMedia,
      nextSubscriptions,
      nextNotifications,
      nextNavLinks,
      nextAnalytics,
      nextPostAnalytics,
      nextSettings,
      nextWebinars,
      nextWebinarRegistrations,
      nextCourses,
      nextCourseTypes,
      nextCourseAds,
      nextCourseProgress,
      nextTemplates,
      nextCertificates,
      nextCommunityCategories,
      nextCommunityQuestions,
      nextCommunityAnswers,
      nextSocialLinks,
      nextVisitorAnalytics
    ] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts({ includeDrafts: true }),
      getFeedback(),
      getCustomPages(true),
      getLandingTopics(true),
      getThirdPartyScripts(),
      getHeroMediaForAdmin(),
      listSubscriptions(),
      getNotifications(),
      getNavigationLinksForAdmin(),
      getAnalyticsSummary(),
      getPostAnalyticsBreakdown(),
      getSiteSettings(),
      getWebinars(true),
      getWebinarRegistrations(),
      getCourses(true),
      getCourseTypesForAdmin(),
      getCourseAdsForAdmin(),
      getCourseProgressForAdmin(),
      getCertificateTemplates(),
      getCertificatesForAdmin(),
      getCommunityCategoriesForAdmin(),
      getCommunityQuestionsForAdmin(),
      getCommunityAnswersForAdmin(),
      getSocialLinksForAdmin(),
      getVisitorAnalytics()
    ]);

    setCategories(nextCategories);
    setSubtopics(nextSubtopics);
    setPosts(nextPosts);
    setFeedback(nextFeedback);
    setPages(nextPages);
    setLandingTopics(nextLandingTopics);
    setScripts(nextScripts);
    setHeroMedia(nextHeroMedia);
    setSubscriptions(nextSubscriptions);
    setNotifications(nextNotifications);
    setNavigationLinks(nextNavLinks);
    setAnalytics(nextAnalytics);
    setPostAnalytics(nextPostAnalytics);
    setSettings(nextSettings);
    setWebinars(nextWebinars);
    setWebinarRegistrations(nextWebinarRegistrations);
    setCoursesData(nextCourses);
    setCourseTypesData(nextCourseTypes);
    setCourseAdsData(nextCourseAds);
    setCourseProgress(nextCourseProgress);
    setCertificateTemplates(nextTemplates);
    setCertificates(nextCertificates);
    setCommunityCategories(nextCommunityCategories);
    setCommunityQuestions(nextCommunityQuestions);
    setCommunityAnswers(nextCommunityAnswers);
    setSocialLinks(nextSocialLinks);
    setVisitorAnalytics(nextVisitorAnalytics);

    setNotFoundForm({
      notFoundRedirectType: nextSettings.notFoundRedirectType,
      notFoundRedirectPath: nextSettings.notFoundRedirectPath,
      notFoundButtonLabel: nextSettings.notFoundButtonLabel
    });

    setAppearanceForm({
      themeMode: nextSettings.themeMode,
      layoutSideGap: String(nextSettings.layoutSideGap),
      heroVideoSliderEnabled: nextSettings.heroVideoSliderEnabled,
      heroImageSliderEnabled: nextSettings.heroImageSliderEnabled,
      logoMode: nextSettings.logoMode,
      logoImageUrl: nextSettings.logoImageUrl,
      logoSize: String(nextSettings.logoSize),
      logoTitleLine1: nextSettings.logoTitleLine1,
      logoTitleLine2: nextSettings.logoTitleLine2,
      logoAccentText: nextSettings.logoAccentText,
      communityApprovalEnabled: nextSettings.communityApprovalEnabled,
      contentPreviewEnabled: nextSettings.contentPreviewEnabled,
      contentPreviewPercent: String(nextSettings.contentPreviewPercent),
      defaultSeoTitle: nextSettings.defaultSeoTitle,
      defaultSeoDescription: nextSettings.defaultSeoDescription,
      defaultOgImage: nextSettings.defaultOgImage,
      siteUrl: nextSettings.siteUrl,
      robotsIndexable: nextSettings.robotsIndexable,
      geminiEnabled: nextSettings.geminiEnabled,
      geminiModel: nextSettings.geminiModel
    });

    setSubtopicForm((prev) => {
      if (prev.categoryId || !nextCategories[0]) {
        return prev;
      }
      return { ...prev, categoryId: nextCategories[0].id };
    });

    setPostForm((prev) => {
      if (prev.categoryId || !nextCategories[0]) {
        return prev;
      }
      const categoryId = nextCategories[0].id;
      const matchingSubtopic = nextSubtopics.find((item) => item.categoryId === categoryId);
      return { ...prev, categoryId, subtopicId: matchingSubtopic?.id ?? "" };
    });

    setNotificationForm((prev) => {
      if (prev.topicId || !nextSubtopics[0]) {
        return prev;
      }
      return { ...prev, topicId: nextSubtopics[0].id };
    });

    setCourseForm((prev) => {
      return prev;
    });
  }, []);
  useEffect(() => {
    if (!profile?.isAdmin) {
      return;
    }
    void refreshAll();
  }, [profile?.isAdmin, refreshAll]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = window.setTimeout(() => setStatus(""), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setSiteOrigin(window.location.origin);
  }, []);

  const postTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    posts.forEach((post) => {
      map[post.id] = post.title;
    });
    return map;
  }, [posts]);
  const registrationsByWebinar = useMemo(() => {
    const map: Record<string, number> = {};
    webinarRegistrations.forEach((item) => {
      map[item.webinarId] = (map[item.webinarId] ?? 0) + 1;
    });
    return map;
  }, [webinarRegistrations]);

  const courseTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    coursesData.forEach((item) => {
      map[item.id] = item.title;
    });
    return map;
  }, [coursesData]);

  const courseTypeNameBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    courseTypesData.forEach((item) => {
      map[item.slug] = item.name;
    });
    return map;
  }, [courseTypesData]);

  const courseAdNameById = useMemo(() => {
    const map: Record<string, string> = {};
    courseAdsData.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [courseAdsData]);

  const templateNameById = useMemo(() => {
    const map: Record<string, string> = {};
    certificateTemplates.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [certificateTemplates]);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="page-main">
          <div className="page-wrap">
            <div className="notice">Checking admin access...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <div className="app-shell">
        <Header />
        <main className="page-main">
          <div className="page-wrap">
            <div className="notice">Admin access required.</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (categoryEditingId) {
      await updateCategory(categoryEditingId, { ...categoryForm, slug: slugify(categoryForm.slug || categoryForm.name) });
      setStatus("Category updated.");
    } else {
      await createCategory({
        ...categoryForm,
        slug: slugify(categoryForm.slug || categoryForm.name),
        order: categories.length + 1
      });
      setStatus("Category created.");
    }

    setCategoryForm({ name: "", slug: "", description: "" });
    setCategoryEditingId("");
    await refreshAll();
  }

  async function handleSubtopicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (subtopicEditingId) {
      await updateSubtopic(subtopicEditingId, {
        categoryId: subtopicForm.categoryId,
        name: subtopicForm.name,
        slug: slugify(subtopicForm.slug || subtopicForm.name),
        showOnHome: subtopicForm.showOnHome
      });
      setStatus("Subtopic updated.");
    } else {
      await createSubtopic({
        categoryId: subtopicForm.categoryId,
        name: subtopicForm.name,
        slug: slugify(subtopicForm.slug || subtopicForm.name),
        order: subtopics.filter((item) => item.categoryId === subtopicForm.categoryId).length + 1,
        showOnHome: subtopicForm.showOnHome
      });
      setStatus("Subtopic created.");
    }

    setSubtopicForm((prev) => ({ ...prev, name: "", slug: "", showOnHome: true }));
    setSubtopicEditingId("");
    await refreshAll();
  }
  async function handleCoverImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadStatus("");
    setUploadingImage(true);

    try {
      const url = await uploadPostImage(file);
      setPostForm((prev) => ({ ...prev, coverImage: url }));
      setUploadStatus("Image uploaded and attached to cover image URL.");
    } catch {
      setUploadStatus("Image upload failed. Please check Firebase Storage setup, then try again.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handlePostSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (postForm.contentMode === "text") {
      const plainContent = postForm.content.replace(/<[^>]+>/g, " ").trim();
      if (!plainContent) {
        setStatus("Post content cannot be empty.");
        return;
      }
    } else {
      const hasDesign = Boolean(postForm.designHtml.trim() || postForm.designCss.trim() || postForm.designJs.trim());
      if (!hasDesign) {
        setStatus("Design mode needs at least HTML, CSS, or JS.");
        return;
      }
    }

    const payload = {
      title: postForm.title,
      slug: slugify(postForm.slug || postForm.title),
      excerpt: postForm.excerpt,
      contentMode: postForm.contentMode,
      content: postForm.content,
      designHtml: postForm.designHtml,
      designCss: postForm.designCss,
      designJs: postForm.designJs,
      coverImage: postForm.coverImage,
      categoryId: postForm.categoryId,
      subtopicId: postForm.subtopicId,
      tags: postForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      seoTitle: postForm.seoTitle || postForm.title,
      seoDescription: postForm.seoDescription || postForm.excerpt,
      isPublished: postForm.isPublished,
      publishedAt: postForm.publishedAt
    };

    if (postEditingId) {
      await updatePost(postEditingId, payload);
      setStatus("Post updated.");
    } else {
      await createPost(payload);
      setStatus("Post created.");
    }

    setUploadStatus("");
    setPostForm(emptyPostForm);
    setPostEditingId("");
    await refreshAll();
  }
  async function handlePageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pageForm.contentMode === "text") {
      if (!pageForm.content.replace(/<[^>]+>/g, " ").trim()) {
        setStatus("Page content cannot be empty.");
        return;
      }
    } else {
      const hasDesign = Boolean(pageForm.designHtml.trim() || pageForm.designCss.trim() || pageForm.designJs.trim());
      if (!hasDesign) {
        setStatus("Design mode needs at least HTML, CSS, or JS.");
        return;
      }
    }

    const payload = {
      ...pageForm,
      slug: slugify(pageForm.slug || pageForm.title)
    };

    if (pageEditingId) {
      await updateCustomPage(pageEditingId, payload);
      setStatus("Custom page updated.");
    } else {
      await createCustomPage(payload);
      setStatus("Custom page created.");
    }

    setPageForm(emptyPageForm);
    setPageEditingId("");
    await refreshAll();
  }

  async function handleLandingTopicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title: landingTopicForm.title.trim(),
      slug: slugify(landingTopicForm.slug || landingTopicForm.title),
      html: landingTopicForm.html,
      css: landingTopicForm.css,
      js: landingTopicForm.js,
      showHeader: landingTopicForm.showHeader,
      showFooter: landingTopicForm.showFooter,
      isPublished: landingTopicForm.isPublished
    };

    if (!payload.title || !payload.slug) {
      setStatus("Landing topic title and slug are required.");
      return;
    }

    if (!payload.html.trim() && !payload.css.trim() && !payload.js.trim()) {
      setStatus("Add HTML/CSS/JS to publish a landing topic.");
      return;
    }

    if (landingTopicEditingId) {
      await updateLandingTopic(landingTopicEditingId, payload);
      setStatus("Landing topic updated.");
    } else {
      await createLandingTopic(payload);
      setStatus("Landing topic created.");
    }

    setLandingTopicForm(emptyLandingTopicForm);
    setLandingTopicEditingId("");
    await refreshAll();
  }
  async function handleScriptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: scriptForm.name.trim(),
      src: scriptForm.src.trim(),
      inlineCode: scriptForm.inlineCode.trim(),
      location: scriptForm.location,
      enabled: true
    };

    if (!payload.name) {
      setStatus("Script name is required.");
      return;
    }

    if (!payload.src && !payload.inlineCode) {
      setStatus("Add script URL or inline code.");
      return;
    }

    await createThirdPartyScript(payload);

    setScriptForm({ name: "", src: "", inlineCode: "", location: "body" });
    setStatus("Script added.");
    await refreshAll();
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setAppearanceForm((prev) => ({ ...prev, logoImageUrl: url, logoMode: "image" }));
      setUploadStatus("Logo uploaded. Save settings to apply.");
    } catch {
      setUploadStatus("Logo upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleHeroMediaFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setHeroForm((prev) => ({ ...prev, source: url }));
      setUploadStatus("Hero media uploaded.");
    } catch {
      setUploadStatus("Hero media upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  function updateHeroDraftRow(rowId: string, patch: Partial<Omit<HeroDraftRow, "id">>) {
    setHeroDraftRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
    );
  }

  function addHeroDraftRow() {
    setHeroDraftRows((prev) => [...prev, createHeroDraftRow(prev[prev.length - 1]?.section ?? "image")]);
  }

  function removeHeroDraftRow(rowId: string) {
    setHeroDraftRows((prev) => {
      if (prev.length <= 1) {
        return [createHeroDraftRow()];
      }
      return prev.filter((row) => row.id !== rowId);
    });
  }

  async function handleHeroDraftFileUpload(rowId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      updateHeroDraftRow(rowId, { source: url });
      setUploadStatus("Hero slide media uploaded.");
    } catch {
      setUploadStatus("Hero slide media upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleHeroDraftRowsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const preparedRows = heroDraftRows
      .map((row) => ({
        section: "image",
        title: row.title.trim(),
        source: row.source.trim(),
        redirectUrl: row.redirectUrl.trim()
      }))
      .filter((row) => row.title || row.source || row.redirectUrl);

    if (!preparedRows.length) {
      setStatus("Add at least one hero slide row first.");
      return;
    }

    const invalidRowIndex = preparedRows.findIndex((row) => !row.title || !row.source);
    if (invalidRowIndex >= 0) {
      setStatus(`Slide row ${invalidRowIndex + 1} needs title and media URL.`);
      return;
    }

    const currentMaxOrder = heroMedia.filter((item) => item.section === "image").reduce((max, item) => Math.max(max, item.order), 0);

    await Promise.all(
      preparedRows.map((row, index) =>
        createHeroMedia({
          section: "image",
          title: row.title,
          source: row.source,
          redirectUrl: row.redirectUrl,
          order: currentMaxOrder + index + 1,
          enabled: true
        })
      )
    );

    setHeroDraftRows([createHeroDraftRow("image")]);
    setStatus(`${preparedRows.length} hero media item(s) created.`);
    await refreshAll();
  }
  async function handleHeroMediaMultiUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const url = await uploadSiteAsset(file);
          return { file, url };
        })
      );

      const redirectLinks = heroBulkRedirectLinks
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const currentMaxOrder = heroMedia.filter((item) => item.section === "image").reduce((max, item) => Math.max(max, item.order), 0);

      await Promise.all(
        uploads.map(({ file, url }, index) => {
          const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "").trim();
          return createHeroMedia({
            section: "image",
            title: nameWithoutExtension || `Hero media ${currentMaxOrder + index + 1}`,
            source: url,
            redirectUrl: redirectLinks[index] ?? "",
            order: currentMaxOrder + index + 1,
            enabled: true
          });
        })
      );

      setHeroBulkRedirectLinks("");
      setStatus(`${uploads.length} hero media item(s) created successfully.`);
      setUploadStatus(`${uploads.length} file(s) uploaded and added to slider.`);
      await refreshAll();
    } catch {
      setUploadStatus("Bulk hero media upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }
  async function handleHeroMediaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      section: "image" as HeroMediaItem["section"],
      title: heroForm.title.trim(),
      source: heroForm.source.trim(),
      redirectUrl: heroForm.redirectUrl.trim(),
      order: Number(heroForm.order || "0"),
      enabled: heroForm.enabled
    };

    if (!payload.title || !payload.source) {
      setStatus("Hero media title and source are required.");
      return;
    }

    if (heroEditingId) {
      await updateHeroMedia(heroEditingId, payload);
      setStatus("Hero media updated.");
    } else {
      await createHeroMedia(payload);
      setStatus("Hero media created.");
    }

    setHeroForm({ section: "image", title: "", source: "", redirectUrl: "", order: "1", enabled: true });
    setHeroEditingId("");
    await refreshAll();
  }

  async function handleAppearanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextSideGap = Math.max(8, Math.min(96, Number(appearanceForm.layoutSideGap || "32") || 32));

    await updateSiteAppearanceSettings({
      themeMode: appearanceForm.themeMode,
      layoutSideGap: nextSideGap,
      heroVideoSliderEnabled: false,
      heroImageSliderEnabled: appearanceForm.heroImageSliderEnabled,
      logoMode: appearanceForm.logoMode,
      logoImageUrl: appearanceForm.logoImageUrl,
      logoSize: Number(appearanceForm.logoSize || "38"),
      logoTitleLine1: appearanceForm.logoTitleLine1,
      logoTitleLine2: appearanceForm.logoTitleLine2,
      logoAccentText: appearanceForm.logoAccentText,
      communityApprovalEnabled: appearanceForm.communityApprovalEnabled,
      contentPreviewEnabled: appearanceForm.contentPreviewEnabled,
      contentPreviewPercent: Number(appearanceForm.contentPreviewPercent || "20"),
      defaultSeoTitle: appearanceForm.defaultSeoTitle,
      defaultSeoDescription: appearanceForm.defaultSeoDescription,
      defaultOgImage: appearanceForm.defaultOgImage,
      siteUrl: appearanceForm.siteUrl,
      robotsIndexable: appearanceForm.robotsIndexable,
      geminiEnabled: appearanceForm.geminiEnabled,
      geminiModel: appearanceForm.geminiModel
    });

    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty("--container-pad", `${nextSideGap}px`);
    }

    setStatus("Appearance and SEO settings updated.");
    await refreshAll();
  }

  async function handleGenerateWithGemini() {
    if (!appearanceForm.geminiEnabled) {
      setStatus("Enable Gemini in settings first.");
      return;
    }

    if (!aiPrompt.trim()) {
      setStatus("Enter a prompt for Gemini.");
      return;
    }

    setAiBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          model: appearanceForm.geminiModel,
          titleHint: postForm.title,
          excerptHint: postForm.excerpt
        })
      });

      const data = (await response.json()) as {
        title?: string;
        excerpt?: string;
        content?: string;
        seoTitle?: string;
        seoDescription?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Gemini generation failed.");
      }

      setPostForm((prev) => {
        const nextTitle = data.title?.trim() || prev.title;
        return {
          ...prev,
          title: nextTitle,
          slug: prev.slug || slugify(nextTitle),
          excerpt: data.excerpt?.trim() || prev.excerpt,
          content: data.content?.trim() || prev.content,
          seoTitle: data.seoTitle?.trim() || prev.seoTitle || nextTitle,
          seoDescription: data.seoDescription?.trim() || prev.seoDescription || prev.excerpt
        };
      });

      setStatus("Gemini content generated and added to form.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Gemini generation failed.");
    } finally {
      setAiBusy(false);
    }
  }
  async function handleNotificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await createNotification({
      title: notificationForm.title,
      message: notificationForm.message,
      target: notificationForm.target,
      topicId: notificationForm.target === "topic" ? notificationForm.topicId : ""
    });

    setNotificationForm((prev) => ({ ...prev, title: "", message: "" }));
    setStatus("Notification queued.");
    await refreshAll();
  }

  async function handleNavigationLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      label: navForm.label.trim(),
      href: navForm.href.trim(),
      location: navForm.location,
      order: Number(navForm.order || "0"),
      parentId: navForm.parentId.trim(),
      enabled: navForm.enabled,
      openInNewTab: navForm.openInNewTab
    };

    if (!payload.label || !payload.href) {
      setStatus("Link label and URL are required.");
      return;
    }

    if (navEditingId) {
      await updateNavigationLink(navEditingId, payload);
      setStatus("Navigation link updated.");
    } else {
      await createNavigationLink(payload);
      setStatus("Navigation link created.");
    }

    setNavForm({
      label: "",
      href: "",
      location: "header",
      order: "1",
      parentId: "",
      enabled: true,
      openInNewTab: false
    });
    setNavEditingId("");
    await refreshAll();
  }

  async function handleCommunityCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: communityCategoryForm.name.trim(),
      slug: slugify(communityCategoryForm.slug || communityCategoryForm.name),
      description: communityCategoryForm.description.trim(),
      order: communityCategories.length + 1,
      enabled: communityCategoryForm.enabled
    };

    if (!payload.name) {
      setStatus("Community category name is required.");
      return;
    }

    if (communityCategoryEditingId) {
      await updateCommunityCategory(communityCategoryEditingId, payload);
      setStatus("Community category updated.");
    } else {
      await createCommunityCategory(payload);
      setStatus("Community category created.");
    }

    setCommunityCategoryEditingId("");
    setCommunityCategoryForm(emptyCommunityCategoryForm);
    await refreshAll();
  }

  async function handleSocialLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      platform: socialForm.platform.trim(),
      label: socialForm.label.trim() || socialForm.platform,
      url: socialForm.url.trim(),
      order: Number(socialForm.order || "0"),
      enabled: socialForm.enabled,
      showInFooter: socialForm.showInFooter,
      showFloating: socialForm.showFloating
    };

    if (!payload.platform || !payload.url) {
      setStatus("Social platform and URL are required.");
      return;
    }

    if (socialEditingId) {
      await updateSocialLink(socialEditingId, payload);
      setStatus("Social link updated.");
    } else {
      await createSocialLink(payload);
      setStatus("Social link created.");
    }

    setSocialEditingId("");
    setSocialForm(emptySocialForm);
    await refreshAll();
  }

  async function handleSeedDefaultSocialLinks() {
    const added = await seedDefaultSocialLinks();
    setStatus(added ? `${added} default social link(s) added.` : "Default social links are already present.");
    await refreshAll();
  }

  async function handleSeedDemoEducationData() {
    setStatus("Seeding demo data. Please wait...");

    let createdTopicPages = 0;
    let createdSubtopics = 0;
    let createdQuestions = 0;
    let createdAnswers = 0;
    let createdCourses = 0;

    const nowIso = new Date().toISOString();

    let nextCategories = await getCategories();
    if (!nextCategories.length) {
      const fallbackCategories = [
        { name: "Electronics", slug: "electronics", description: "Components and circuits", order: 1 },
        { name: "Mechanical", slug: "mechanical", description: "Mechanisms and machines", order: 2 },
        { name: "Software", slug: "software", description: "Programming and embedded systems", order: 3 }
      ];

      for (const item of fallbackCategories) {
        await createCategory(item);
      }
      nextCategories = await getCategories();
    }

    const existingSubtopics = await getSubtopics();
    const subtopicSeeds = [
      { name: "Voltage Basics", slug: "voltage-basics", categoryIndex: 0 },
      { name: "Current Flow", slug: "current-flow", categoryIndex: 0 },
      { name: "Kirchhoff Laws", slug: "kirchhoff-laws", categoryIndex: 0 },
      { name: "Gear Ratio", slug: "gear-ratio", categoryIndex: 1 },
      { name: "Embedded C", slug: "embedded-c", categoryIndex: 2 }
    ];

    for (const seed of subtopicSeeds) {
      if (existingSubtopics.some((item) => item.slug === seed.slug)) {
        continue;
      }

      const category = nextCategories[seed.categoryIndex] ?? nextCategories[0];
      if (!category) {
        continue;
      }

      await createSubtopic({
        categoryId: category.id,
        name: seed.name,
        slug: seed.slug,
        order: existingSubtopics.filter((item) => item.categoryId === category.id).length + 1,
        showOnHome: true
      });
      createdSubtopics += 1;
    }

    const existingLandingTopics = await getLandingTopics(true);
    const landingSeeds = [
      {
        title: "Ohm Law Visual Lab",
        slug: "demo-ohm-law-visual-lab",
        html: '<section class="demo-topic"><h1>Ohm Law Visual Lab</h1><p>Interactive engineering story block.</p><button>Run Preview</button></section>',
        css: '.demo-topic{padding:2rem;border:1px solid #ff7a00;border-radius:14px;background:linear-gradient(140deg,#fff8f2,#fff);font-family:monospace}.demo-topic h1{margin:0 0 .5rem;color:#ff7a00}',
        js: 'console.log("Ohm Law Visual Lab loaded");'
      },
      {
        title: "Motor Starter Blueprint",
        slug: "demo-motor-starter-blueprint",
        html: '<section class="demo-topic"><h1>Motor Starter Blueprint</h1><p>Step-by-step wiring flow.</p><button>Open Diagram</button></section>',
        css: '.demo-topic{padding:2rem;border:1px solid #222;border-radius:14px;background:#fff;font-family:monospace}.demo-topic h1{margin:0 0 .5rem}',
        js: 'console.log("Motor Starter Blueprint loaded");'
      },
      {
        title: "PLC Ladder Starter",
        slug: "demo-plc-ladder-starter",
        html: '<section class="demo-topic"><h1>PLC Ladder Starter</h1><p>Practice rungs with live notes.</p><button>Simulate</button></section>',
        css: '.demo-topic{padding:2rem;border:1px dashed #ff7a00;border-radius:14px;background:#fffdf9;font-family:monospace}.demo-topic h1{margin:0 0 .5rem}',
        js: 'console.log("PLC Ladder Starter loaded");'
      },
      {
        title: "CAD to CNC Flow",
        slug: "demo-cad-to-cnc-flow",
        html: '<section class="demo-topic"><h1>CAD to CNC Flow</h1><p>From design to machining preview.</p><button>Start Flow</button></section>',
        css: '.demo-topic{padding:2rem;border:1px solid #2d2d2d;border-radius:14px;background:linear-gradient(130deg,#ffffff,#f5f5f5);font-family:monospace}.demo-topic h1{margin:0 0 .5rem}',
        js: 'console.log("CAD to CNC Flow loaded");'
      },
      {
        title: "Embedded Debug Arena",
        slug: "demo-embedded-debug-arena",
        html: '<section class="demo-topic"><h1>Embedded Debug Arena</h1><p>Trace, inspect, and fix firmware signals.</p><button>Inspect Signals</button></section>',
        css: '.demo-topic{padding:2rem;border:1px solid #ff7a00;border-radius:14px;background:linear-gradient(130deg,#fff,#fff4ea);font-family:monospace}.demo-topic h1{margin:0 0 .5rem;color:#ff7a00}',
        js: 'console.log("Embedded Debug Arena loaded");'
      }
    ];

    for (const seed of landingSeeds) {
      if (existingLandingTopics.some((item) => item.slug === seed.slug)) {
        continue;
      }

      await createLandingTopic({
        title: seed.title,
        slug: seed.slug,
        html: seed.html,
        css: seed.css,
        js: seed.js,
        showHeader: true,
        showFooter: true,
        isPublished: true
      });
      createdTopicPages += 1;
    }

    let communityCategories = await getCommunityCategoriesForAdmin();
    if (!communityCategories.length) {
      const communityCategorySeeds = [
        { name: "Electronics Q&A", slug: "electronics-qa", description: "Circuit doubts", order: 1, enabled: true },
        { name: "Mechanical Q&A", slug: "mechanical-qa", description: "Machine doubts", order: 2, enabled: true },
        { name: "Software Q&A", slug: "software-qa", description: "Code doubts", order: 3, enabled: true }
      ];
      for (const seed of communityCategorySeeds) {
        await createCommunityCategory(seed);
      }
      communityCategories = await getCommunityCategoriesForAdmin();
    }

    const questionSeeds = [
      "Why does LED burn without resistor?",
      "How to calculate motor torque quickly?",
      "Best way to debounce a push button in firmware?"
    ];

    const existingQuestions = await getCommunityQuestionsForAdmin();
    for (let i = 0; i < questionSeeds.length; i += 1) {
      const questionText = questionSeeds[i];
      if (existingQuestions.some((item) => item.question.toLowerCase() === questionText.toLowerCase())) {
        continue;
      }

      const category = communityCategories[i % Math.max(communityCategories.length, 1)];
      if (!category) {
        continue;
      }

      await createCommunityQuestion({
        categoryId: category.id,
        question: questionText,
        authorName: "Demo User",
        authorEmail: "demo@engineerwithme.com",
        authorUserId: "demo-user",
        requiresApproval: false
      });
      createdQuestions += 1;
    }

    const refreshedQuestions = await getCommunityQuestionsForAdmin();
    const existingAnswers = await getCommunityAnswersForAdmin();
    const answerSeeds = [
      {
        question: "Why does LED burn without resistor?",
        answer: "LED needs current limiting. Add resistor using R = (Vsupply - Vled) / Iled."
      },
      {
        question: "How to calculate motor torque quickly?",
        answer: "Use T = P / omega. Convert RPM to rad/s before calculating."
      },
      {
        question: "Best way to debounce a push button in firmware?",
        answer: "Use a 20-50ms debounce timer and validate stable state before action."
      }
    ];

    for (const seed of answerSeeds) {
      const question = refreshedQuestions.find(
        (item) => item.question.toLowerCase() === seed.question.toLowerCase()
      );
      if (!question) {
        continue;
      }

      const alreadyExists = existingAnswers.some(
        (item) => item.questionId === question.id && item.answer.toLowerCase() === seed.answer.toLowerCase()
      );
      if (alreadyExists) {
        continue;
      }

      await createCommunityAnswer({
        questionId: question.id,
        categoryId: question.categoryId,
        answer: seed.answer,
        authorName: "Demo Mentor",
        authorEmail: "mentor@engineerwithme.com",
        authorUserId: "demo-mentor",
        requiresApproval: false
      });
      createdAnswers += 1;
    }

    const requiredCourseTypes = [
      { name: "Basics", slug: "basics", order: 1 },
      { name: "Free Learning", slug: "free-learning", order: 2 },
      { name: "Paid Course", slug: "paid-course", order: 3 }
    ];
    let courseTypesAll = await getCourseTypesForAdmin();

    for (const required of requiredCourseTypes) {
      if (courseTypesAll.some((item) => item.slug === required.slug)) {
        continue;
      }
      await createCourseType({
        name: required.name,
        slug: required.slug,
        order: required.order,
        enabled: true
      });
      courseTypesAll = await getCourseTypesForAdmin();
    }

    const courseTypes = courseTypesAll.filter((item) => item.enabled);
    const existingCourses = await getCourses(true);
    const templates = await getCertificateTemplates();
    const defaultTemplateId = templates.find((item) => item.enabled)?.id ?? templates[0]?.id ?? "";

    for (const type of courseTypes) {
      for (let i = 1; i <= 2; i += 1) {
        const slug = `demo-${type.slug}-${i}`;
        if (existingCourses.some((item) => item.slug === slug)) {
          continue;
        }

        await createCourse({
          title: `${type.name} Demo Course ${i}`,
          slug,
          description: `Demo course ${i} for ${type.name}.`,
          coverImage: "",
          typeSlug: type.slug,
          templateId: defaultTemplateId,
          lessons: [
            { id: `lesson-${slug}-1`, title: "Introduction", content: "Course overview and goals.", order: 1 },
            { id: `lesson-${slug}-2`, title: "Core Concept", content: "Main engineering concept with examples.", order: 2 },
            { id: `lesson-${slug}-3`, title: "Practice", content: "Try the guided implementation steps.", order: 3 }
          ],
          passingScore: 70,
          questions: [
            { question: "What is the key formula used in this module?", options: ["A", "B", "C"], correctOptionIndex: 0 },
            { question: "What is the safest next step before testing?", options: ["Measure", "Ignore", "Skip"], correctOptionIndex: 0 }
          ],
          adsEnabled: false,
          adIds: [],
          isPublished: true
        });
        createdCourses += 1;
      }
    }

    await refreshAll();

    setStatus(
      `Demo data ready. Landing topics: ${createdTopicPages}, Browse topics: ${createdSubtopics}, Community Q: ${createdQuestions}, Community A: ${createdAnswers}, Courses: ${createdCourses}.`
    );
  }
  async function handleCommunityApprovalToggle() {
    const nextValue = !settings.communityApprovalEnabled;
    await updateSiteAppearanceSettings({ communityApprovalEnabled: nextValue });
    setAppearanceForm((prev) => ({ ...prev, communityApprovalEnabled: nextValue }));
    setStatus(`Community approval ${nextValue ? "enabled" : "disabled"}.`);
    await refreshAll();
  }

  async function handleNotFoundSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await updateNotFoundSettings({
      notFoundRedirectType: notFoundForm.notFoundRedirectType,
      notFoundRedirectPath: notFoundForm.notFoundRedirectPath,
      notFoundButtonLabel: notFoundForm.notFoundButtonLabel
    });

    setStatus("404 page settings updated.");
    await refreshAll();
  }

  async function handleWebinarBannerUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setWebinarForm((prev) => ({ ...prev, bannerImage: url }));
      setUploadStatus("Webinar banner uploaded.");
    } catch {
      setUploadStatus("Webinar banner upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleWebinarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startAt = webinarForm.startAt ? new Date(webinarForm.startAt).toISOString() : new Date().toISOString();
    const endAt = webinarForm.endAt ? new Date(webinarForm.endAt).toISOString() : startAt;

    const payload = {
      title: webinarForm.title.trim(),
      slug: slugify(webinarForm.slug || webinarForm.title),
      description: webinarForm.description.trim(),
      bannerImage: webinarForm.bannerImage.trim(),
      startAt,
      endAt,
      meetingUrl: webinarForm.meetingUrl.trim(),
      isPublished: webinarForm.isPublished,
      showOnHome: webinarForm.showOnHome,
      showPublicPage: webinarForm.showPublicPage
    };

    if (!payload.title || !payload.slug || !payload.meetingUrl) {
      setStatus("Webinar title, slug and meeting URL are required.");
      return;
    }

    if (webinarEditingId) {
      await updateWebinar(webinarEditingId, payload);
      setStatus("Webinar updated.");
    } else {
      await createWebinar(payload);
      setStatus("Webinar created.");
    }

    setWebinarForm(emptyWebinarForm);
    setWebinarEditingId("");
    await refreshAll();
  }

  async function handleCourseCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setCourseForm((prev) => ({ ...prev, coverImage: url }));
      setUploadStatus("Course cover uploaded.");
    } catch {
      setUploadStatus("Course cover upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleCourseSectionsImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const lessons = await parseCourseSectionsSpreadsheet(file);
      if (!lessons.length) {
        setStatus("No sections found in the uploaded file.");
      } else {
        setCourseSectionDrafts(lessonsToSectionDrafts(lessons));
        setCourseForm((prev) => ({ ...prev, lessonsInput: lessonsToInput(lessons) }));
        setStatus(`${lessons.length} section(s) imported.`);
      }
    } catch {
      setStatus("Section import failed. Use CSV or XLSX with title/content columns.");
    } finally {
      event.target.value = "";
    }
  }

  function syncSectionDrafts(rows: CourseSectionDraft[]) {
    setCourseSectionDrafts(rows);
    setCourseForm((prev) => ({ ...prev, lessonsInput: sectionDraftsToInput(rows) }));
  }

  function syncQuestionDrafts(rows: CourseQuestionDraft[]) {
    setCourseQuestionDrafts(rows);
    setCourseForm((prev) => ({ ...prev, questionsInput: questionDraftsToInput(rows) }));
  }

  function handleLoadSectionFieldsFromText() {
    const lessons = parseLessonsInput(courseForm.lessonsInput);
    const rows = lessonsToSectionDrafts(lessons);
    setCourseSectionDrafts(rows);
    setStatus(`${rows.length} section field row(s) loaded from text.`);
  }

  function handleAddSectionField() {
    syncSectionDrafts([...courseSectionDrafts, createCourseSectionDraft()]);
  }

  function handleUpdateSectionField(rowId: string, patch: Partial<Omit<CourseSectionDraft, "id">>) {
    const rows = courseSectionDrafts.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    syncSectionDrafts(rows);
  }

  function handleRemoveSectionField(rowId: string) {
    const rows = courseSectionDrafts.filter((row) => row.id !== rowId);
    syncSectionDrafts(rows.length ? rows : [createCourseSectionDraft()]);
  }

  function handleLoadQuestionFieldsFromText() {
    const questions = parseQuestionsInput(courseForm.questionsInput);
    const rows = questionsToQuestionDrafts(questions);
    setCourseQuestionDrafts(rows);
    setStatus(`${rows.length} question row(s) loaded from text.`);
  }

  function handleAddQuestionField() {
    syncQuestionDrafts([...courseQuestionDrafts, createCourseQuestionDraft()]);
  }

  function handleUpdateQuestionField(
    rowId: string,
    patch: Partial<Omit<CourseQuestionDraft, "id">>
  ) {
    const rows = courseQuestionDrafts.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    syncQuestionDrafts(rows);
  }

  function handleRemoveQuestionField(rowId: string) {
    const rows = courseQuestionDrafts.filter((row) => row.id !== rowId);
    syncQuestionDrafts(rows.length ? rows : [createCourseQuestionDraft()]);
  }

  function handleAddSectionLine() {
    handleAddSectionField();
  }
  function toggleCourseAdSelection(adId: string) {
    setCourseForm((prev) => {
      const exists = prev.adIds.includes(adId);
      const adIds = exists ? prev.adIds.filter((item) => item !== adId) : [...prev.adIds, adId];
      return { ...prev, adIds };
    });
  }

  async function handleCourseTypeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: courseTypeForm.name.trim(),
      slug: slugify(courseTypeForm.slug || courseTypeForm.name),
      order: courseTypesData.length + 1,
      enabled: courseTypeForm.enabled
    };

    if (!payload.name || !payload.slug) {
      setStatus("Course type name and slug are required.");
      return;
    }

    if (courseTypeEditingId) {
      await updateCourseType(courseTypeEditingId, payload);
      setStatus("Course type updated.");
    } else {
      await createCourseType(payload);
      setStatus("Course type created.");
    }

    setCourseTypeEditingId("");
    setCourseTypeForm(emptyCourseTypeForm);
    await refreshAll();
  }

  async function handleCourseAdSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: courseAdForm.name.trim(),
      type: courseAdForm.type,
      title: courseAdForm.title.trim(),
      source: courseAdForm.source.trim(),
      redirectUrl: courseAdForm.redirectUrl.trim(),
      code: courseAdForm.code,
      enabled: courseAdForm.enabled
    };

    if (!payload.name) {
      setStatus("Course ad name is required.");
      return;
    }

    if (payload.type === "code" && !payload.code.trim()) {
      setStatus("Code ad requires ad code.");
      return;
    }

    if (payload.type !== "code" && !payload.source) {
      setStatus("Image/Video ad requires source URL.");
      return;
    }

    if (courseAdEditingId) {
      await updateCourseAd(courseAdEditingId, payload);
      setStatus("Course ad updated.");
    } else {
      await createCourseAd(payload);
      setStatus("Course ad created.");
    }

    setCourseAdEditingId("");
    setCourseAdForm(emptyCourseAdForm);
    await refreshAll();
  }

  async function handleCourseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lessons = parseLessonsInput(courseForm.lessonsInput);
    const questions = parseQuestionsInput(courseForm.questionsInput);

    if (!lessons.length) {
      setStatus("Add at least one section. Format: Section title::Section content");
      return;
    }

    if (!questions.length) {
      setStatus("Add at least one test question.");
      return;
    }

    const payload = {
      title: courseForm.title.trim(),
      slug: slugify(courseForm.slug || courseForm.title),
      description: courseForm.description.trim(),
      coverImage: courseForm.coverImage.trim(),
      typeSlug: slugify(courseForm.typeSlug || "basics") || "basics",
      templateId: courseForm.templateId.trim(),
      lessons,
      passingScore: Math.max(1, Math.min(100, Number(courseForm.passingScore || "70") || 70)),
      questions,
      adsEnabled: courseForm.adsEnabled,
      adIds: courseForm.adIds,
      isPublished: courseForm.isPublished
    };

    if (!payload.title || !payload.slug) {
      setStatus("Course title and slug are required.");
      return;
    }

    if (courseEditingId) {
      await updateCourse(courseEditingId, payload);
      setStatus("Course updated.");
    } else {
      await createCourse(payload);
      setStatus("Course created.");
    }

    setCourseForm((prev) => ({
      ...emptyCourseForm,
      templateId: prev.templateId,
      typeSlug: prev.typeSlug
    }));
    setCourseSectionDrafts([createCourseSectionDraft()]);
    setCourseQuestionDrafts([createCourseQuestionDraft()]);
    setCourseEditingId("");
    await refreshAll();
  }
  async function handleTemplateBackgroundUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setTemplateForm((prev) => ({ ...prev, backgroundImage: url }));
      setUploadStatus("Certificate background uploaded.");
    } catch {
      setUploadStatus("Certificate background upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleTemplateSignatureUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setTemplateForm((prev) => ({ ...prev, signatureImage: url }));
      setUploadStatus("Certificate signature uploaded.");
    } catch {
      setUploadStatus("Certificate signature upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleTemplateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: templateForm.name.trim(),
      backgroundImage: templateForm.backgroundImage.trim(),
      signatureImage: templateForm.signatureImage.trim(),
      enabled: templateForm.enabled
    };

    if (!payload.name) {
      setStatus("Template name is required.");
      return;
    }

    if (templateEditingId) {
      await updateCertificateTemplate(templateEditingId, payload);
      setStatus("Certificate template updated.");
    } else {
      await createCertificateTemplate(payload);
      setStatus("Certificate template created.");
    }

    setTemplateForm(emptyTemplateForm);
    setTemplateEditingId("");
    await refreshAll();
  }
  const filteredSubtopics = subtopics.filter((item) => item.categoryId === postForm.categoryId);

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="admin-layout">
          <div className="label">Admin Panel</div>
          <h1 className="h2">Phase 2 CMS and Analytics</h1>
          <p className="body-txt">Only admins can create or update content. Users can submit only feedback.</p>
          {status ? <div className="notice">{status}</div> : null}
          {status ? <div className="status-toast">{status}</div> : null}

          <div className="tab-row" role="tablist" aria-label="Admin sections">
            {adminTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab ${isTabActive(tab.key) ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="admin-section admin-card" hidden={!isTabActive("general")}>
            <h3>Analytics Dashboard</h3>
            <div className="admin-grid">
              <div className="notice"><strong>Active users:</strong> {analytics.activeUsers}</div>
              <div className="notice"><strong>Post views:</strong> {analytics.views}</div>
              <div className="notice"><strong>Downloads:</strong> {analytics.downloads}</div>
              <div className="notice"><strong>Shares:</strong> {analytics.shares}</div>
              <div className="notice"><strong>Feedback count:</strong> {analytics.feedbackCount}</div>
              <div className="notice"><strong>Subscriptions:</strong> {subscriptions.length}</div>
              <div className="notice"><strong>Notifications:</strong> {notifications.length}</div>
              <div className="notice"><strong>Total visitors:</strong> {visitorAnalytics.totalVisitors}</div>
            </div>
            <div className="form-actions" style={{ marginTop: "0.8rem" }}>
              <button
                className="btn btn-outline"
                type="button"
                onClick={async () => {
                  await updateLiveTracking(!settings.liveTrackingEnabled);
                  await refreshAll();
                }}
              >
                Live Tracking: {settings.liveTrackingEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </section>






          <section className="admin-section admin-card" hidden={!isTabActive("general")}>
            <h3>Visitor Analytics</h3>
            <div className="notice"><strong>Total visitors:</strong> {visitorAnalytics.totalVisitors}</div>
            <div className="table-like">
              <div className="notice">
                <strong>Date-wise visitors</strong>
                {visitorAnalytics.byDate.length ? (
                  visitorAnalytics.byDate.map((item) => (
                    <p className="muted" key={`visitor-date-${item.date}`}>{item.date}: {item.count}</p>
                  ))
                ) : (
                  <p className="muted">No visitor data yet.</p>
                )}
              </div>
              <div className="notice">
                <strong>Country-wise visitors</strong>
                {visitorAnalytics.byCountry.length ? (
                  visitorAnalytics.byCountry.map((item) => (
                    <p className="muted" key={`visitor-country-${item.country}`}>{item.country}: {item.count}</p>
                  ))
                ) : (
                  <p className="muted">No visitor data yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("general")}>
            <h3>Social Links (Footer + Floating)</h3>
            <p className="muted">Manage social media links shown in footer and floating left icons.</p>
            <div className="form-actions" style={{ marginBottom: "0.65rem" }}>
              <button className="btn btn-outline" type="button" onClick={() => void handleSeedDefaultSocialLinks()}>
                Add Missing Default Social Platforms
              </button>
            </div>
            <form className="form-grid" onSubmit={handleSocialLinkSubmit}>
              <input
                placeholder="Platform (youtube, instagram, x, linkedin...)"
                value={socialForm.platform}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, platform: event.target.value }))}
                required
              />
              <input
                placeholder="Label"
                value={socialForm.label}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, label: event.target.value }))}
              />
              <input
                placeholder="https://..."
                value={socialForm.url}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, url: event.target.value }))}
                required
              />
              <input
                type="number"
                min={0}
                placeholder="Order"
                value={socialForm.order}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, order: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={socialForm.enabled}
                  onChange={(event) => setSocialForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={socialForm.showInFooter}
                  onChange={(event) => setSocialForm((prev) => ({ ...prev, showInFooter: event.target.checked }))}
                />
                Show in footer
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={socialForm.showFloating}
                  onChange={(event) => setSocialForm((prev) => ({ ...prev, showFloating: event.target.checked }))}
                />
                Show in floating icons
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {socialEditingId ? "Update Social Link" : "Add Social Link"}
                </button>
                {socialEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setSocialEditingId("");
                      setSocialForm(emptySocialForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
            <div className="table-like">
              {socialLinks.length ? (
                socialLinks.map((item) => (
                  <article className="notice" key={`social-link-${item.id}`}>
                    <strong>{item.label}</strong>
                    <p className="muted">
                      {item.platform} | {item.url} | order {item.order} | {item.enabled ? "enabled" : "disabled"}
                    </p>
                    <p className="muted">Footer: {item.showInFooter ? "yes" : "no"} | Floating: {item.showFloating ? "yes" : "no"}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setSocialEditingId(item.id);
                          setSocialForm({
                            platform: item.platform,
                            label: item.label,
                            url: item.url,
                            order: String(item.order),
                            enabled: item.enabled,
                            showInFooter: item.showInFooter,
                            showFloating: item.showFloating
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void updateSocialLink(item.id, { enabled: !item.enabled }).then(refreshAll)}
                      >
                        {item.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteSocialLink(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No social links added yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("engagement")}>
            <h3>Community Categories and Moderation</h3>
            <div className="notice" style={{ marginBottom: "0.8rem" }}>
              <p className="muted" style={{ marginTop: 0 }}>
                Approval mode is currently <strong>{settings.communityApprovalEnabled ? "enabled" : "disabled"}</strong>.
              </p>
              <div className="form-actions">
                <button className="btn btn-outline" type="button" onClick={() => void handleCommunityApprovalToggle()}>
                  {settings.communityApprovalEnabled ? "Disable Approval (Instant Publish)" : "Enable Approval"}
                </button>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCommunityCategorySubmit}>
              <input
                placeholder="Category name"
                value={communityCategoryForm.name}
                onChange={(event) => setCommunityCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                placeholder="Category slug"
                value={communityCategoryForm.slug}
                onChange={(event) => setCommunityCategoryForm((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <textarea
                rows={2}
                placeholder="Description"
                value={communityCategoryForm.description}
                onChange={(event) => setCommunityCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={communityCategoryForm.enabled}
                  onChange={(event) => setCommunityCategoryForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {communityCategoryEditingId ? "Update Community Category" : "Add Community Category"}
                </button>
                {communityCategoryEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setCommunityCategoryEditingId("");
                      setCommunityCategoryForm(emptyCommunityCategoryForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {communityCategories.length ? (
                communityCategories.map((item) => (
                  <article className="notice" key={`community-category-${item.id}`}>
                    <strong>{item.name}</strong>
                    <p className="muted">{item.slug} | {item.enabled ? "enabled" : "disabled"}</p>
                    <p className="muted">{item.description}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setCommunityCategoryEditingId(item.id);
                          setCommunityCategoryForm({
                            name: item.name,
                            slug: item.slug,
                            description: item.description,
                            enabled: item.enabled
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void updateCommunityCategory(item.id, { enabled: !item.enabled }).then(refreshAll)}
                      >
                        {item.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteCommunityCategory(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No community categories yet.</p>
              )}
            </div>

            <div className="table-like">
              <div className="notice">
                <strong>Questions pending approval</strong>
                {communityQuestions.filter((item) => item.status === "pending").length ? (
                  communityQuestions
                    .filter((item) => item.status === "pending")
                    .map((item) => (
                      <div key={`community-question-${item.id}`} style={{ marginTop: "0.75rem" }}>
                        <p>{item.question}</p>
                        <p className="muted">{item.authorName} | {new Date(item.createdAt).toLocaleString()}</p>
                        <div className="form-actions">
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => void updateCommunityQuestionStatus(item.id, "approved" as CommunityStatus).then(refreshAll)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => void updateCommunityQuestionStatus(item.id, "rejected" as CommunityStatus).then(refreshAll)}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => void deleteCommunityQuestion(item.id).then(refreshAll)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="muted">No pending questions.</p>
                )}
              </div>

              <div className="notice">
                <strong>Answers pending approval</strong>
                {communityAnswers.filter((item) => item.status === "pending").length ? (
                  communityAnswers
                    .filter((item) => item.status === "pending")
                    .map((item) => (
                      <div key={`community-answer-${item.id}`} style={{ marginTop: "0.75rem" }}>
                        <p>{item.answer}</p>
                        <p className="muted">{item.authorName} | {new Date(item.createdAt).toLocaleString()}</p>
                        <div className="form-actions">
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => void updateCommunityAnswerStatus(item.id, "approved" as CommunityStatus).then(refreshAll)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => void updateCommunityAnswerStatus(item.id, "rejected" as CommunityStatus).then(refreshAll)}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => void deleteCommunityAnswer(item.id).then(refreshAll)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="muted">No pending answers.</p>
                )}
              </div>
            </div>
          </section>
          <section className="admin-section admin-card" hidden={!isTabActive("seo")}>
            <h3>Theme, Logo, Preview and SEO Settings</h3>
            <p className="muted">Manage dark mode, global page side gap, logo, preview gate, Gemini helper and SEO defaults.</p>
            <form className="form-grid" onSubmit={handleAppearanceSubmit}>
              <select
                value={appearanceForm.themeMode}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, themeMode: event.target.value as SiteSettings["themeMode"] }))
                }
              >
                <option value="light">Light theme</option>
                <option value="dark">Dark theme</option>
              </select>
              <input
                type="number"
                min={8}
                max={96}
                placeholder="Global side gap (px)"
                value={appearanceForm.layoutSideGap}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, layoutSideGap: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.heroImageSliderEnabled}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, heroImageSliderEnabled: event.target.checked }))
                  }
                />
                Enable hero image slider
              </label>
              <select
                value={appearanceForm.logoMode}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, logoMode: event.target.value as SiteSettings["logoMode"] }))
                }
              >
                <option value="text">Text logo</option>
                <option value="image">Image logo</option>
              </select>
              <input
                placeholder="Logo image URL"
                value={appearanceForm.logoImageUrl}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoImageUrl: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
              <input
                type="number"
                min={26}
                max={80}
                placeholder="Logo size (px)"
                value={appearanceForm.logoSize}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoSize: event.target.value }))}
              />
              <input
                placeholder="Logo line 1"
                value={appearanceForm.logoTitleLine1}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoTitleLine1: event.target.value }))}
              />
              <input
                placeholder="Logo line 2"
                value={appearanceForm.logoTitleLine2}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoTitleLine2: event.target.value }))}
              />
              <input
                placeholder="Logo accent text"
                value={appearanceForm.logoAccentText}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoAccentText: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.communityApprovalEnabled}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, communityApprovalEnabled: event.target.checked }))
                  }
                />
                Require approval for new community questions and answers
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.contentPreviewEnabled}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, contentPreviewEnabled: event.target.checked }))
                  }
                />
                Enable post preview gate before login
              </label>
              <input
                type="number"
                min={5}
                max={95}
                placeholder="Preview percent"
                value={appearanceForm.contentPreviewPercent}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, contentPreviewPercent: event.target.value }))
                }
              />
              <input
                placeholder="Default SEO title"
                value={appearanceForm.defaultSeoTitle}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, defaultSeoTitle: event.target.value }))}
              />
              <textarea
                rows={2}
                placeholder="Default SEO description"
                value={appearanceForm.defaultSeoDescription}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, defaultSeoDescription: event.target.value }))
                }
              />
              <input
                placeholder="Default OG image URL"
                value={appearanceForm.defaultOgImage}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, defaultOgImage: event.target.value }))}
              />
              <input
                placeholder="Site URL (for sitemap and robots)"
                value={appearanceForm.siteUrl}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, siteUrl: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.robotsIndexable}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, robotsIndexable: event.target.checked }))
                  }
                />
                Allow robots indexing
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.geminiEnabled}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, geminiEnabled: event.target.checked }))
                  }
                />
                Enable Gemini content tools
              </label>
              <input
                placeholder="Gemini model"
                value={appearanceForm.geminiModel}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, geminiModel: event.target.value }))}
              />
              <button className="btn btn-primary" type="submit">
                Save Appearance and SEO
              </button>
            </form>
            <div className="notice" style={{ marginTop: "0.7rem" }}>
              Auto generated: <strong>/robots.txt</strong> and <strong>/sitemap.xml</strong>
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("general")}>
            <h3>Hero Slider Media (Image)</h3>
            <p className="muted">Recommended size: images 1600x900 (16:9).</p>
            <form className="form-grid" onSubmit={handleHeroDraftRowsSubmit}>
              <div className="form-actions">
                <button className="btn btn-outline" type="button" onClick={addHeroDraftRow}>+ Add Slide</button>
              </div>
              {heroDraftRows.map((row, index) => (
                <div className="notice" key={row.id}>
                  <strong>Slide {index + 1}</strong>
                  <div className="form-grid" style={{ marginTop: "0.55rem" }}>
                    <input value="Image slide" disabled />
                    <input
                      placeholder="Slide title"
                      value={row.title}
                      onChange={(event) => updateHeroDraftRow(row.id, { title: event.target.value })}
                    />
                    <input
                      placeholder="Media URL"
                      value={row.source}
                      onChange={(event) => updateHeroDraftRow(row.id, { source: event.target.value })}
                    />
                    <input
                      placeholder="Redirect link (optional)"
                      value={row.redirectUrl}
                      onChange={(event) => updateHeroDraftRow(row.id, { redirectUrl: event.target.value })}
                    />
                    <input type="file" accept="image/*" onChange={(event) => void handleHeroDraftFileUpload(row.id, event)} />
                  </div>
                  <div className="form-actions" style={{ marginTop: "0.6rem" }}>
                    <button className="btn btn-outline" type="button" onClick={() => removeHeroDraftRow(row.id)}>
                      Remove Row
                    </button>
                  </div>
                </div>
              ))}
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Create Slides</button>
              </div>
            </form>

            <form className="form-grid" onSubmit={handleHeroMediaSubmit}>
              <input value="Image slide" disabled />
              <input
                placeholder="Slide title"
                value={heroForm.title}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                placeholder="Media URL"
                value={heroForm.source}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, source: event.target.value }))}
                required
              />
              <input
                placeholder="Redirect link (optional)"
                value={heroForm.redirectUrl}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, redirectUrl: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleHeroMediaFileUpload} />
              <textarea
                rows={3}
                placeholder="Bulk redirect links (optional, one link per line in upload order)"
                value={heroBulkRedirectLinks}
                onChange={(event) => setHeroBulkRedirectLinks(event.target.value)}
              />
              <input type="file" accept="image/*" multiple onChange={handleHeroMediaMultiUpload} />
              <input
                type="number"
                min={0}
                placeholder="Order"
                value={heroForm.order}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, order: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={heroForm.enabled}
                  onChange={(event) => setHeroForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {heroEditingId ? "Update Media" : "Add Media"}
                </button>
                {heroEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setHeroEditingId("");
                      setHeroForm({ section: "image", title: "", source: "", redirectUrl: "", order: "1", enabled: true });
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {heroMedia.filter((item) => item.section === "image").length ? ( heroMedia.filter((item) => item.section === "image").map((item) => (
                  <div className="notice" key={item.id}>
                    <strong>{item.title}</strong>
                    <p className="muted">
                      order {item.order} | {item.enabled ? "enabled" : "disabled"}
                    </p>
                    <p className="muted">{item.source}</p>
                    <p className="muted">Redirect: {item.redirectUrl || "none"}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setHeroEditingId(item.id);
                          setHeroForm({
                            section: "image",
                            title: item.title,
                            source: item.source,
                            redirectUrl: item.redirectUrl ?? "",
                            order: String(item.order),
                            enabled: item.enabled
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteHeroMedia(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No hero media configured yet.</p>
              )}
            </div>
          </section>


          <section className="admin-section admin-card" hidden={!isTabActive("seo")}>
            <h3>404 Redirect Settings</h3>
            <p className="muted">Configure where users should go from invalid URLs.</p>
            <form className="form-grid" onSubmit={handleNotFoundSettingsSubmit}>
              <select
                value={notFoundForm.notFoundRedirectType}
                onChange={(event) =>
                  setNotFoundForm((prev) => ({
                    ...prev,
                    notFoundRedirectType: event.target.value as SiteSettings["notFoundRedirectType"]
                  }))
                }
              >
                <option value="home">Redirect to home page (/)</option>
                <option value="custom">Redirect to custom page/path</option>
              </select>

              {notFoundForm.notFoundRedirectType === "custom" ? (
                <input
                  placeholder="/pages/privacy-policy"
                  value={notFoundForm.notFoundRedirectPath}
                  onChange={(event) =>
                    setNotFoundForm((prev) => ({ ...prev, notFoundRedirectPath: event.target.value }))
                  }
                  required
                />
              ) : null}

              <input
                placeholder="Button label"
                value={notFoundForm.notFoundButtonLabel}
                onChange={(event) =>
                  setNotFoundForm((prev) => ({ ...prev, notFoundButtonLabel: event.target.value }))
                }
                required
              />

              <button className="btn btn-primary" type="submit">
                Save 404 Settings
              </button>
            </form>
            <div className="notice" style={{ marginTop: "0.8rem" }}>
              Current target: {settings.notFoundRedirectType === "custom" ? settings.notFoundRedirectPath : "/"}
            </div>
          </section>
          <section className="admin-section admin-card" hidden={!isTabActive("general")}>
            <h3>Menu and Footer Links</h3>
            <p className="muted">Create links for header menu and footer pages list.</p>
            <form className="form-grid" onSubmit={handleNavigationLinkSubmit}>
              <input
                placeholder="Link label"
                value={navForm.label}
                onChange={(event) => setNavForm((prev) => ({ ...prev, label: event.target.value }))}
                required
              />
              <input
                placeholder="/pages/about or #topics or https://example.com"
                value={navForm.href}
                onChange={(event) => setNavForm((prev) => ({ ...prev, href: event.target.value }))}
                required
              />
              <select
                value={navForm.location}
                onChange={(event) =>
                  setNavForm((prev) => ({ ...prev, location: event.target.value as NavigationLink["location"] }))
                }
              >
                <option value="header">Header menu</option>
                <option value="footer">Footer links</option>
              </select>
              <input
                type="number"
                min={0}
                placeholder="Display order"
                value={navForm.order}
                onChange={(event) => setNavForm((prev) => ({ ...prev, order: event.target.value }))}
              />
              <select
                value={navForm.parentId}
                onChange={(event) => setNavForm((prev) => ({ ...prev, parentId: event.target.value }))}
              >
                <option value="">No parent (top level)</option>
                {navigationLinks
                  .filter((link) => link.location === navForm.location && !link.parentId)
                  .map((link) => (
                    <option key={`parent-${link.id}`} value={link.id}>
                      Parent: {link.label}
                    </option>
                  ))}
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={navForm.enabled}
                  onChange={(event) => setNavForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={navForm.openInNewTab}
                  onChange={(event) => setNavForm((prev) => ({ ...prev, openInNewTab: event.target.checked }))}
                />
                Open in new tab
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {navEditingId ? "Update Link" : "Add Link"}
                </button>
                {navEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setNavEditingId("");
                      setNavForm({
                        label: "",
                        href: "",
                        location: "header",
                        order: "1",
                        parentId: "",
                        enabled: true,
                        openInNewTab: false
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {navigationLinks.length ? (
                navigationLinks.map((item) => (
                  <div className="notice" key={item.id}>
                    <strong>{item.label}</strong>
                    <p className="muted">
                      {item.location} | {item.href} | order {item.order} | parent {item.parentId || "none"} | {item.enabled ? "enabled" : "disabled"}
                    </p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setNavEditingId(item.id);
                          setNavForm({
                            label: item.label,
                            href: item.href,
                            location: item.location,
                            order: String(item.order),
                            parentId: item.parentId ?? "",
                            enabled: item.enabled,
                            openInNewTab: item.openInNewTab
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteNavigationLink(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No navigation links configured yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("topics")}>
            <h3>Subtopic Management</h3>
            <form className="form-grid" onSubmit={handleSubtopicSubmit}>
              <select value={subtopicForm.categoryId} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
                ))}
              </select>
              <input placeholder="Subtopic name" value={subtopicForm.name} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <input placeholder="Subtopic slug" value={subtopicForm.slug} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <label><input type="checkbox" checked={subtopicForm.showOnHome} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, showOnHome: event.target.checked }))} /> Show in Home Browse Topics section</label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{subtopicEditingId ? "Update Subtopic" : "Add Subtopic"}</button>
                {subtopicEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setSubtopicEditingId(""); setSubtopicForm((prev) => ({ ...prev, name: "", slug: "", showOnHome: true })); }}>Cancel Edit</button> : null}
              </div>
            </form>
            <div className="table-like">
              {subtopics.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.name}</strong> <span className="muted">({item.slug})</span>
                  <p className="muted">Category: {categories.find((cat) => cat.id === item.categoryId)?.name ?? item.categoryId} | Home Browse: {item.showOnHome !== false ? "shown" : "hidden"}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => { setSubtopicEditingId(item.id); setSubtopicForm({ categoryId: item.categoryId, name: item.name, slug: item.slug, showOnHome: item.showOnHome !== false }); }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void updateSubtopic(item.id, { showOnHome: item.showOnHome === false }).then(refreshAll)}>{item.showOnHome !== false ? "Hide from Home" : "Show on Home"}</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteSubtopic(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={true}>
            <h3>Post Management (SEO included)</h3>
            <div className="notice" style={{ marginBottom: "0.9rem" }}>
              <strong>Gemini AI Assistant</strong>
              <p className="muted">Set server env `GEMINI_API_KEY`, then use prompt to generate title/content/SEO draft.</p>
              <textarea
                rows={3}
                placeholder="Write a beginner post about Ohms law with examples"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
              />
              <div className="form-actions">
                <button className="btn btn-outline" type="button" onClick={handleGenerateWithGemini} disabled={aiBusy}>
                  {aiBusy ? "Generating..." : "Generate with Gemini"}
                </button>
              </div>
            </div>
            <form className="form-grid" onSubmit={handlePostSubmit}>
              <input placeholder="Title" value={postForm.title} onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input placeholder="Slug" value={postForm.slug} onChange={(event) => setPostForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <textarea rows={2} placeholder="Excerpt" value={postForm.excerpt} onChange={(event) => setPostForm((prev) => ({ ...prev, excerpt: event.target.value }))} required />
              <select
                value={postForm.contentMode}
                onChange={(event) => setPostForm((prev) => ({ ...prev, contentMode: event.target.value as "text" | "design" }))}
              >
                <option value="text">Text Editor</option>
                <option value="design">HTML/CSS/JS Design</option>
              </select>
              {postForm.contentMode === "text" ? (
                <RichPostEditor
                  value={postForm.content}
                  onChange={(value) => setPostForm((prev) => ({ ...prev, content: value }))}
                />
              ) : (
                <DesignStudio
                  title="Post Design Studio"
                  htmlCode={postForm.designHtml}
                  cssCode={postForm.designCss}
                  jsCode={postForm.designJs}
                  onHtmlCodeChange={(value) => setPostForm((prev) => ({ ...prev, designHtml: value }))}
                  onCssCodeChange={(value) => setPostForm((prev) => ({ ...prev, designCss: value }))}
                  onJsCodeChange={(value) => setPostForm((prev) => ({ ...prev, designJs: value }))}
                />
              )}
              <input placeholder="Cover image URL" value={postForm.coverImage} onChange={(event) => setPostForm((prev) => ({ ...prev, coverImage: event.target.value }))} required />
              <input type="file" accept="image/*" onChange={handleCoverImageUpload} />
              {uploadingImage ? <p className="muted">Uploading image...</p> : null}
              {uploadStatus ? <div className="notice">{uploadStatus}</div> : null}
              <input placeholder="Tags (comma separated)" value={postForm.tags} onChange={(event) => setPostForm((prev) => ({ ...prev, tags: event.target.value }))} />
              <select value={postForm.categoryId} onChange={(event) => {
                const categoryId = event.target.value;
                const nextSubtopic = subtopics.find((item) => item.categoryId === categoryId);
                setPostForm((prev) => ({ ...prev, categoryId, subtopicId: nextSubtopic?.id ?? "" }));
              }}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <select value={postForm.subtopicId} onChange={(event) => setPostForm((prev) => ({ ...prev, subtopicId: event.target.value }))}>
                {filteredSubtopics.map((subtopic) => <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>)}
              </select>
              <input type="date" value={postForm.publishedAt} onChange={(event) => setPostForm((prev) => ({ ...prev, publishedAt: event.target.value }))} />
              <input placeholder="SEO title" value={postForm.seoTitle} onChange={(event) => setPostForm((prev) => ({ ...prev, seoTitle: event.target.value }))} />
              <textarea rows={2} placeholder="SEO description" value={postForm.seoDescription} onChange={(event) => setPostForm((prev) => ({ ...prev, seoDescription: event.target.value }))} />
              <label><input type="checkbox" checked={postForm.isPublished} onChange={(event) => setPostForm((prev) => ({ ...prev, isPublished: event.target.checked }))} /> Publish now</label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{postEditingId ? "Update Post" : "Add Post"}</button>
                {postEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setPostEditingId(""); setPostForm(emptyPostForm); }}>Cancel Edit</button> : null}
              </div>
            </form>

            <div className="table-like">
              {posts.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.title}</strong>
                  <p className="muted">/{item.slug}</p>
                  <p className="muted">{item.excerpt}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => {
                      setPostEditingId(item.id);
                      setPostForm({
                        title: item.title,
                        slug: item.slug,
                        excerpt: item.excerpt,
                        contentMode: item.contentMode === "design" ? "design" : "text",
                        content: item.content,
                        designHtml: item.designHtml ?? "",
                        designCss: item.designCss ?? "",
                        designJs: item.designJs ?? "",
                        coverImage: item.coverImage,
                        categoryId: item.categoryId,
                        subtopicId: item.subtopicId,
                        tags: item.tags.join(", "),
                        seoTitle: item.seoTitle ?? "",
                        seoDescription: item.seoDescription ?? "",
                        isPublished: item.isPublished,
                        publishedAt: item.publishedAt
                      });
                    }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deletePost(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-section admin-card" hidden={!isTabActive("learning")}>
            <h3>Webinar Management</h3>
            <p className="muted">Create webinars, generate shortcode automatically, and track registrations.</p>
            <form className="form-grid" onSubmit={handleWebinarSubmit}>
              <input
                placeholder="Webinar title"
                value={webinarForm.title}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                placeholder="Webinar slug"
                value={webinarForm.slug}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <textarea
                rows={2}
                placeholder="Webinar description"
                value={webinarForm.description}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
              <input
                placeholder="Banner image URL"
                value={webinarForm.bannerImage}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, bannerImage: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleWebinarBannerUpload} />
              <input
                type="datetime-local"
                value={webinarForm.startAt}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, startAt: event.target.value }))}
                required
              />
              <input
                type="datetime-local"
                value={webinarForm.endAt}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, endAt: event.target.value }))}
                required
              />
              <input
                placeholder="Meeting URL"
                value={webinarForm.meetingUrl}
                onChange={(event) => setWebinarForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={webinarForm.isPublished}
                  onChange={(event) => setWebinarForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                />
                Published
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={webinarForm.showOnHome}
                  onChange={(event) => setWebinarForm((prev) => ({ ...prev, showOnHome: event.target.checked }))}
                />
                Show on home page
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={webinarForm.showPublicPage}
                  onChange={(event) => setWebinarForm((prev) => ({ ...prev, showPublicPage: event.target.checked }))}
                />
                Show on webinar listing page
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {webinarEditingId ? "Update Webinar" : "Create Webinar"}
                </button>
                {webinarEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setWebinarEditingId("");
                      setWebinarForm(emptyWebinarForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {webinars.length ? (
                webinars.map((item) => (
                  <article className="notice" key={`admin-webinar-${item.id}`}>
                    <strong>{item.title}</strong>
                    <p className="muted">
                      /webinars/{item.slug} | registrations {registrationsByWebinar[item.id] ?? 0}
                    </p>
                    <p className="muted">Shortcode: {item.shortcode}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          const startInput = Number.isNaN(new Date(item.startAt).getTime())
                            ? ""
                            : new Date(item.startAt).toISOString().slice(0, 16);
                          const endInput = Number.isNaN(new Date(item.endAt).getTime())
                            ? ""
                            : new Date(item.endAt).toISOString().slice(0, 16);

                          setWebinarEditingId(item.id);
                          setWebinarForm({
                            title: item.title,
                            slug: item.slug,
                            description: item.description,
                            bannerImage: item.bannerImage,
                            startAt: startInput,
                            endAt: endInput,
                            meetingUrl: item.meetingUrl,
                            isPublished: item.isPublished,
                            showOnHome: item.showOnHome,
                            showPublicPage: item.showPublicPage
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteWebinar(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No webinars created yet.</p>
              )}
            </div>
          </section><section className="admin-section admin-card" hidden={!isTabActive("learning")}>
            <h3>Course Types</h3>
            <p className="muted">Default types are Basics, Free Learning, Paid Course. You can add more types anytime.</p>
            <form className="form-grid" onSubmit={handleCourseTypeSubmit}>
              <input
                placeholder="Course type name"
                value={courseTypeForm.name}
                onChange={(event) => setCourseTypeForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                placeholder="Course type slug"
                value={courseTypeForm.slug}
                onChange={(event) => setCourseTypeForm((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={courseTypeForm.enabled}
                  onChange={(event) => setCourseTypeForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {courseTypeEditingId ? "Update Type" : "Add Type"}
                </button>
                {courseTypeEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setCourseTypeEditingId("");
                      setCourseTypeForm(emptyCourseTypeForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like" style={{ marginTop: "0.8rem" }}>
              {courseTypesData.length ? (
                courseTypesData.map((item) => (
                  <article className="notice" key={`course-type-${item.id}`}>
                    <strong>{item.name}</strong>
                    <p className="muted">{item.slug} | {item.enabled ? "enabled" : "disabled"}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setCourseTypeEditingId(item.id);
                          setCourseTypeForm({
                            name: item.name,
                            slug: item.slug,
                            enabled: item.enabled
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void updateCourseType(item.id, { enabled: !item.enabled }).then(refreshAll)}
                      >
                        {item.enabled ? "Disable" : "Enable"}
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => void deleteCourseType(item.id).then(refreshAll)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No course types yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("learning")}>
            <h3>Course Ads</h3>
            <p className="muted">Create ads (image/video/code) and attach them per course.</p>
            <form className="form-grid" onSubmit={handleCourseAdSubmit}>
              <input
                placeholder="Ad name"
                value={courseAdForm.name}
                onChange={(event) => setCourseAdForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <select
                value={courseAdForm.type}
                onChange={(event) => setCourseAdForm((prev) => ({ ...prev, type: event.target.value as CourseAd["type"] }))}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="code">Code</option>
              </select>
              <input
                placeholder="Ad title"
                value={courseAdForm.title}
                onChange={(event) => setCourseAdForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              {courseAdForm.type === "code" ? (
                <textarea
                  rows={5}
                  placeholder="Ad HTML/JS code"
                  value={courseAdForm.code}
                  onChange={(event) => setCourseAdForm((prev) => ({ ...prev, code: event.target.value }))}
                  required
                />
              ) : (
                <>
                  <input
                    placeholder="Ad source URL"
                    value={courseAdForm.source}
                    onChange={(event) => setCourseAdForm((prev) => ({ ...prev, source: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Redirect URL (optional)"
                    value={courseAdForm.redirectUrl}
                    onChange={(event) => setCourseAdForm((prev) => ({ ...prev, redirectUrl: event.target.value }))}
                  />
                </>
              )}
              <label>
                <input
                  type="checkbox"
                  checked={courseAdForm.enabled}
                  onChange={(event) => setCourseAdForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {courseAdEditingId ? "Update Ad" : "Create Ad"}
                </button>
                {courseAdEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setCourseAdEditingId("");
                      setCourseAdForm(emptyCourseAdForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like" style={{ marginTop: "0.8rem" }}>
              {courseAdsData.length ? (
                courseAdsData.map((item) => (
                  <article className="notice" key={`course-ad-${item.id}`}>
                    <strong>{item.name}</strong>
                    <p className="muted">{item.type} | {item.enabled ? "enabled" : "disabled"}</p>
                    <p className="muted">{item.title || item.source || "Code ad"}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setCourseAdEditingId(item.id);
                          setCourseAdForm({
                            name: item.name,
                            type: item.type,
                            title: item.title,
                            source: item.source,
                            redirectUrl: item.redirectUrl,
                            code: item.code,
                            enabled: item.enabled
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void updateCourseAd(item.id, { enabled: !item.enabled }).then(refreshAll)}
                      >
                        {item.enabled ? "Disable" : "Enable"}
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => void deleteCourseAd(item.id).then(refreshAll)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No course ads created yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("learning")}>
            <h3>Course and Certification Management</h3>
                        <p className="muted">
              Section format: <code>Section title::Section content</code> per line. Questions format:
              <code>Question||Option A|Option B|Option C||0</code> per line.
            </p>
            <div className="form-actions" style={{ marginBottom: "0.65rem" }}>
              <button className="btn btn-outline" type="button" onClick={() => void handleSeedDemoEducationData()}>
                Seed Demo Data (Topics + Community + Courses)
              </button>
            </div>
            <form className="form-grid" onSubmit={handleCourseSubmit}>
              <input
                placeholder="Course title"
                value={courseForm.title}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                placeholder="Course slug"
                value={courseForm.slug}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <select
                value={courseForm.typeSlug}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, typeSlug: event.target.value }))}
              >
                <option value="">Select course type (optional)</option>
                {(courseTypesData.length ? courseTypesData : [{ id: "fallback-basics", name: "Basics", slug: "basics", enabled: true, order: 1, updatedAt: "" }])
                  .filter((item) => item.enabled)
                  .map((item) => (
                    <option key={`course-type-option-${item.id}`} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <textarea
                rows={2}
                placeholder="Course description"
                value={courseForm.description}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
              <input
                placeholder="Course cover image URL"
                value={courseForm.coverImage}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, coverImage: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleCourseCoverUpload} />
              <select
                value={courseForm.templateId}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, templateId: event.target.value }))}
              >
                <option value="">Select certificate template (optional)</option>
                {certificateTemplates.map((item) => (
                  <option key={`course-template-${item.id}`} value={item.id}>
                    {item.name} {item.enabled ? "(enabled)" : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={100}
                placeholder="Passing score"
                value={courseForm.passingScore}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, passingScore: event.target.value }))}
              />

              <div className="form-actions">
                <button className="btn btn-outline" type="button" onClick={handleAddSectionLine}>+ Add Section</button>
                <button className="btn btn-outline" type="button" onClick={downloadSampleCourseSectionsFile}>Download Section Sample</button>
                <button className="btn btn-outline" type="button" onClick={handleLoadSectionFieldsFromText}>Load Section Fields from Text</button>
              </div>
              <input type="file" accept=".csv,.xlsx" onChange={handleCourseSectionsImport} />
              <textarea
                rows={6}
                placeholder="Section 1 title::Section 1 content"
                value={courseForm.lessonsInput}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, lessonsInput: event.target.value }))}
                required
              />

              <div className="notice">
                <strong>Section Fields Builder</strong>
                <div className="form-actions" style={{ marginTop: "0.6rem" }}>
                  <button className="btn btn-outline" type="button" onClick={handleAddSectionField}>+ Add Section Field</button>
                </div>
                {courseSectionDrafts.map((row, index) => (
                  <div className="form-grid" key={row.id} style={{ marginTop: "0.65rem" }}>
                    <input
                      placeholder={`Section ${index + 1} title`}
                      value={row.title}
                      onChange={(event) => handleUpdateSectionField(row.id, { title: event.target.value })}
                    />
                    <textarea
                      rows={2}
                      placeholder="Section content"
                      value={row.content}
                      onChange={(event) => handleUpdateSectionField(row.id, { content: event.target.value })}
                    />
                    <button className="btn btn-outline" type="button" onClick={() => handleRemoveSectionField(row.id)}>Remove Section</button>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button className="btn btn-outline" type="button" onClick={handleLoadQuestionFieldsFromText}>Load Question Fields from Text</button>
                <button className="btn btn-outline" type="button" onClick={handleAddQuestionField}>+ Add Question</button>
              </div>
              <textarea
                rows={5}
                placeholder="Question||Option A|Option B||0"
                value={courseForm.questionsInput}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, questionsInput: event.target.value }))}
                required
              />

              <div className="notice">
                <strong>Question Fields Builder</strong>
                {courseQuestionDrafts.map((row, index) => (
                  <div className="form-grid" key={row.id} style={{ marginTop: "0.65rem" }}>
                    <input
                      placeholder={`Question ${index + 1}`}
                      value={row.question}
                      onChange={(event) => handleUpdateQuestionField(row.id, { question: event.target.value })}
                    />
                    <input
                      placeholder="Option A"
                      value={row.optionA}
                      onChange={(event) => handleUpdateQuestionField(row.id, { optionA: event.target.value })}
                    />
                    <input
                      placeholder="Option B"
                      value={row.optionB}
                      onChange={(event) => handleUpdateQuestionField(row.id, { optionB: event.target.value })}
                    />
                    <input
                      placeholder="Option C (optional)"
                      value={row.optionC}
                      onChange={(event) => handleUpdateQuestionField(row.id, { optionC: event.target.value })}
                    />
                    <input
                      placeholder="Option D (optional)"
                      value={row.optionD}
                      onChange={(event) => handleUpdateQuestionField(row.id, { optionD: event.target.value })}
                    />
                    <select
                      value={String(row.correctOptionIndex)}
                      onChange={(event) =>
                        handleUpdateQuestionField(row.id, {
                          correctOptionIndex: Number(event.target.value || "0")
                        })
                      }
                    >
                      <option value="0">Correct: Option A</option>
                      <option value="1">Correct: Option B</option>
                      <option value="2">Correct: Option C</option>
                      <option value="3">Correct: Option D</option>
                    </select>
                    <button className="btn btn-outline" type="button" onClick={() => handleRemoveQuestionField(row.id)}>Remove Question</button>
                  </div>
                ))}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={courseForm.adsEnabled}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, adsEnabled: event.target.checked }))}
                />
                Enable ads on this course page
              </label>

              {courseForm.adsEnabled ? (
                <div className="notice">
                  <strong>Select ads for this course</strong>
                  <div className="table-like" style={{ marginTop: "0.65rem" }}>
                    {courseAdsData.length ? (
                      courseAdsData.map((item) => (
                        <label key={`course-ad-select-${item.id}`} style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={courseForm.adIds.includes(item.id)}
                            onChange={() => toggleCourseAdSelection(item.id)}
                          />
                          {item.name} ({item.type})
                        </label>
                      ))
                    ) : (
                      <p className="muted">No ads available. Create ads first.</p>
                    )}
                  </div>
                </div>
              ) : null}

              <label>
                <input
                  type="checkbox"
                  checked={courseForm.isPublished}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                />
                Published
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {courseEditingId ? "Update Course" : "Create Course"}
                </button>
                {courseEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setCourseEditingId("");
                      setCourseForm((prev) => ({
                        ...emptyCourseForm,
                        templateId: prev.templateId,
                        typeSlug: prev.typeSlug
                      }));
                      setCourseSectionDrafts([createCourseSectionDraft()]);
                      setCourseQuestionDrafts([createCourseQuestionDraft()]);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {coursesData.length ? (
                coursesData.map((item) => (
                  <article className="notice" key={`admin-course-${item.id}`}>
                    <strong>{item.title}</strong>
                    <p className="muted">
                      /courses/{item.slug} | type {courseTypeNameBySlug[item.typeSlug] ?? item.typeSlug} | sections {item.lessons.length} | questions {item.questions.length} | pass {item.passingScore}%
                    </p>
                    <p className="muted">Template: {templateNameById[item.templateId ?? ""] ?? "none"}</p>
                    <p className="muted">Ads: {item.adsEnabled ? item.adIds.map((id) => courseAdNameById[id] ?? id).join(", ") || "enabled" : "disabled"}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setCourseEditingId(item.id);
                          setCourseForm({
                            title: item.title,
                            slug: item.slug,
                            description: item.description,
                            coverImage: item.coverImage,
                            typeSlug: item.typeSlug || "basics",
                            templateId: item.templateId ?? "",
                            passingScore: String(item.passingScore),
                            lessonsInput: lessonsToInput(item.lessons),
                            questionsInput: questionsToInput(item.questions),
                            adsEnabled: item.adsEnabled === true,
                            adIds: item.adIds ?? [],
                            isPublished: item.isPublished
                          });
                          setCourseSectionDrafts(lessonsToSectionDrafts(item.lessons));
                          setCourseQuestionDrafts(questionsToQuestionDrafts(item.questions));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteCourse(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No courses created yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("learning")}>
            <h3>Certificate Templates and Signature</h3>
            <form className="form-grid" onSubmit={handleTemplateSubmit}>
              <input
                placeholder="Template name"
                value={templateForm.name}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                placeholder="Background image URL"
                value={templateForm.backgroundImage}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, backgroundImage: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleTemplateBackgroundUpload} />
              <input
                placeholder="Signature image URL"
                value={templateForm.signatureImage}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, signatureImage: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleTemplateSignatureUpload} />
              <label>
                <input
                  type="checkbox"
                  checked={templateForm.enabled}
                  onChange={(event) => setTemplateForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {templateEditingId ? "Update Template" : "Create Template"}
                </button>
                {templateEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setTemplateEditingId("");
                      setTemplateForm(emptyTemplateForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {certificateTemplates.length ? (
                certificateTemplates.map((item) => (
                  <article className="notice" key={`admin-template-${item.id}`}>
                    <strong>{item.name}</strong>
                    <p className="muted">{item.enabled ? "Enabled" : "Disabled"}</p>
                    <p className="muted">Background: {item.backgroundImage || "not set"}</p>
                    <p className="muted">Signature: {item.signatureImage || "not set"}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setTemplateEditingId(item.id);
                          setTemplateForm({
                            name: item.name,
                            backgroundImage: item.backgroundImage,
                            signatureImage: item.signatureImage,
                            enabled: item.enabled
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteCertificateTemplate(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No certificate templates created yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("learning")}>
            <h3>Webinar, Course Progress and Certificate Analytics</h3>
            <div className="table-like">
              <div className="notice">
                <strong>Course Progress ({courseProgress.length})</strong>
                {courseProgress.length ? (
                  courseProgress.slice(0, 50).map((item) => (
                    <p className="muted" key={`course-progress-${item.id}`}>
                      {courseTitleById[item.courseId] ?? item.courseId} - {item.userEmail} - lessons {item.completedLessonIds.length} - score {item.score}% - {item.testPassed ? "passed" : "in progress"}
                    </p>
                  ))
                ) : (
                  <p className="muted">No course progress records yet.</p>
                )}
              </div>
              <div className="notice">
                <strong>Issued Certificates ({certificates.length})</strong>
                {certificates.length ? (
                  certificates.slice(0, 50).map((item) => (
                    <p className="muted" key={`certificate-${item.id}`}>
                      {courseTitleById[item.courseId] ?? item.courseId} - {item.userEmail} - {item.certificateNumber} - template {templateNameById[item.templateId] ?? "none"}
                    </p>
                  ))
                ) : (
                  <p className="muted">No certificates issued yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("general")}>
            <h3>Category Links</h3>
            <p className="muted">Use these links for sharing category pages.</p>
            <div className="table-like">
              <div className="notice">
                <strong>Category links</strong>
                {categories.length ? (
                  categories.map((item) => {
                    const path = `/?category=${encodeURIComponent(item.slug)}#categories`;
                    const href = `${siteOrigin}${path}`;
                    return (
                      <p className="muted" key={`category-link-${item.id}`}>
                        <a className="nav-link" href={href} target="_blank" rel="noreferrer">{href}</a>
                      </p>
                    );
                  })
                ) : (
                  <p className="muted">No categories available.</p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("pages")}>
            <h3>Custom Page Management</h3>
            <form className="form-grid" onSubmit={handlePageSubmit}>
              <input placeholder="Page title" value={pageForm.title} onChange={(event) => setPageForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input placeholder="Page slug" value={pageForm.slug} onChange={(event) => setPageForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <select
                value={pageForm.contentMode}
                onChange={(event) => setPageForm((prev) => ({ ...prev, contentMode: event.target.value as "text" | "design" }))}
              >
                <option value="text">Text Content</option>
                <option value="design">HTML/CSS/JS Design</option>
              </select>
              {pageForm.contentMode === "text" ? (
                <textarea rows={7} placeholder="Page content" value={pageForm.content} onChange={(event) => setPageForm((prev) => ({ ...prev, content: event.target.value }))} required />
              ) : (
                <DesignStudio
                  title="Page Design Studio"
                  htmlCode={pageForm.designHtml}
                  cssCode={pageForm.designCss}
                  jsCode={pageForm.designJs}
                  onHtmlCodeChange={(value) => setPageForm((prev) => ({ ...prev, designHtml: value }))}
                  onCssCodeChange={(value) => setPageForm((prev) => ({ ...prev, designCss: value }))}
                  onJsCodeChange={(value) => setPageForm((prev) => ({ ...prev, designJs: value }))}
                />
              )}
              <label><input type="checkbox" checked={pageForm.showHeader} onChange={(event) => setPageForm((prev) => ({ ...prev, showHeader: event.target.checked }))} /> Show header</label>
              <label><input type="checkbox" checked={pageForm.showFooter} onChange={(event) => setPageForm((prev) => ({ ...prev, showFooter: event.target.checked }))} /> Show footer</label>
              <input placeholder="SEO title" value={pageForm.seoTitle} onChange={(event) => setPageForm((prev) => ({ ...prev, seoTitle: event.target.value }))} />
              <textarea rows={2} placeholder="SEO description" value={pageForm.seoDescription} onChange={(event) => setPageForm((prev) => ({ ...prev, seoDescription: event.target.value }))} />
              <label><input type="checkbox" checked={pageForm.isPublished} onChange={(event) => setPageForm((prev) => ({ ...prev, isPublished: event.target.checked }))} /> Publish page</label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{pageEditingId ? "Update Page" : "Create Page"}</button>
                {pageEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setPageEditingId(""); setPageForm(emptyPageForm); }}>Cancel Edit</button> : null}
              </div>
            </form>
            <div className="table-like">
              {pages.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.title}</strong> <span className="muted">(/pages/{item.slug})</span>
                  <p className="muted">{item.isPublished ? "Published" : "Draft"} | {item.contentMode === "design" ? "Design" : "Text"}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => {
                      setPageEditingId(item.id);
                      setPageForm({
                        title: item.title,
                        slug: item.slug,
                        contentMode: item.contentMode === "design" ? "design" : "text",
                        content: item.content,
                        designHtml: item.designHtml ?? "",
                        designCss: item.designCss ?? "",
                        designJs: item.designJs ?? "",
                        showHeader: item.showHeader !== false,
                        showFooter: item.showFooter !== false,
                        seoTitle: item.seoTitle ?? "",
                        seoDescription: item.seoDescription ?? "",
                        isPublished: item.isPublished
                      });
                    }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteCustomPage(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("topics")}>
            <h3>Landing Topic Builder</h3>
            <p className="muted">Create unlimited topic landing pages with custom slug, header/footer toggle, import files/folder/zip, and live preview before publishing.</p>
            <form className="form-grid" onSubmit={handleLandingTopicSubmit}>
              <input
                placeholder="Landing topic title"
                value={landingTopicForm.title}
                onChange={(event) => setLandingTopicForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                placeholder="Landing topic slug"
                value={landingTopicForm.slug}
                onChange={(event) => setLandingTopicForm((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <label><input type="checkbox" checked={landingTopicForm.showHeader} onChange={(event) => setLandingTopicForm((prev) => ({ ...prev, showHeader: event.target.checked }))} /> Show header</label>
              <label><input type="checkbox" checked={landingTopicForm.showFooter} onChange={(event) => setLandingTopicForm((prev) => ({ ...prev, showFooter: event.target.checked }))} /> Show footer</label>
              <label><input type="checkbox" checked={landingTopicForm.isPublished} onChange={(event) => setLandingTopicForm((prev) => ({ ...prev, isPublished: event.target.checked }))} /> Publish landing topic</label>
              <DesignStudio
                title="Landing Topic Design Studio"
                htmlCode={landingTopicForm.html}
                cssCode={landingTopicForm.css}
                jsCode={landingTopicForm.js}
                onHtmlCodeChange={(value) => setLandingTopicForm((prev) => ({ ...prev, html: value }))}
                onCssCodeChange={(value) => setLandingTopicForm((prev) => ({ ...prev, css: value }))}
                onJsCodeChange={(value) => setLandingTopicForm((prev) => ({ ...prev, js: value }))}
              />
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {landingTopicEditingId ? "Update Landing Topic" : "Create Landing Topic"}
                </button>
                {landingTopicEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setLandingTopicEditingId("");
                      setLandingTopicForm(emptyLandingTopicForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
            <div className="table-like">
              {landingTopics.length ? (
                landingTopics.map((item) => (
                  <article className="notice" key={`landing-topic-${item.id}`}>
                    <strong>{item.title}</strong>
                    <p className="muted">/topic/{item.slug} | {item.isPublished ? "published" : "draft"}</p>
                    <p className="muted">Header: {item.showHeader ? "show" : "hide"} | Footer: {item.showFooter ? "show" : "hide"}</p>
                    <div className="form-actions">
                      <a className="btn btn-outline" href={`${siteOrigin}/topic/${item.slug}`} target="_blank" rel="noreferrer">Open</a>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setLandingTopicEditingId(item.id);
                          setLandingTopicForm({
                            title: item.title,
                            slug: item.slug,
                            html: item.html,
                            css: item.css,
                            js: item.js,
                            showHeader: item.showHeader,
                            showFooter: item.showFooter,
                            isPublished: item.isPublished
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => void deleteLandingTopic(item.id).then(refreshAll)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No landing topics created yet.</p>
              )}
            </div>
          </section>











          <section className="admin-section admin-card" hidden={!isTabActive("seo")}>
            <h3>Third-Party Scripts</h3>
            <p className="muted">Add external script URL, inline script code, or both.</p>
            <form className="form-grid" onSubmit={handleScriptSubmit}>
              <input
                placeholder="Script name"
                value={scriptForm.name}
                onChange={(event) => setScriptForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                placeholder="https://example.com/script.js (optional)"
                value={scriptForm.src}
                onChange={(event) => setScriptForm((prev) => ({ ...prev, src: event.target.value }))}
              />
              <textarea
                rows={5}
                placeholder="Inline script code (optional)"
                value={scriptForm.inlineCode}
                onChange={(event) => setScriptForm((prev) => ({ ...prev, inlineCode: event.target.value }))}
              />
              <select value={scriptForm.location} onChange={(event) => setScriptForm((prev) => ({ ...prev, location: event.target.value as "head" | "body" }))}>
                <option value="head">Head</option>
                <option value="body">Body</option>
              </select>
              <button className="btn btn-primary" type="submit">Add Script</button>
            </form>
            <div className="table-like">
              {scripts.length ? scripts.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.name}</strong>
                  {item.src ? <p className="muted">Source: {item.src}</p> : null}
                  {item.inlineCode ? <p className="muted">Inline code: {item.inlineCode.slice(0, 120)}{item.inlineCode.length > 120 ? "..." : ""}</p> : null}
                  {!item.src && !item.inlineCode ? <p className="muted">No script content provided.</p> : null}
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => void updateThirdPartyScript(item.id, { enabled: !item.enabled }).then(refreshAll)}>{item.enabled ? "Disable" : "Enable"}</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteThirdPartyScript(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              )) : <p className="muted">No scripts configured.</p>}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("engagement")}>
            <h3>Subscription and Notification Center</h3>
            <form className="form-grid" onSubmit={handleNotificationSubmit}>
              <input placeholder="Notification title" value={notificationForm.title} onChange={(event) => setNotificationForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <textarea rows={2} placeholder="Notification message" value={notificationForm.message} onChange={(event) => setNotificationForm((prev) => ({ ...prev, message: event.target.value }))} required />
              <select value={notificationForm.target} onChange={(event) => setNotificationForm((prev) => ({ ...prev, target: event.target.value as "website" | "topic" }))}>
                <option value="website">Website subscribers</option>
                <option value="topic">Specific topic subscribers</option>
              </select>
              {notificationForm.target === "topic" ? (
                <select value={notificationForm.topicId} onChange={(event) => setNotificationForm((prev) => ({ ...prev, topicId: event.target.value }))}>
                  {subtopics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              ) : null}
              <button className="btn btn-primary" type="submit">Send Update</button>
            </form>

            <div className="table-like">
              <div className="notice">
                <strong>Subscribers ({subscriptions.length})</strong>
                <p className="muted">Latest 10</p>
                {subscriptions.slice(0, 10).map((item) => (
                  <p key={item.id} className="muted">{item.email} {item.topicId ? `-> ${item.topicId}` : "-> website"}</p>
                ))}
              </div>
              <div className="notice">
                <strong>Recent notifications</strong>
                {notifications.slice(0, 8).map((item) => (
                  <p key={item.id} className="muted">{item.title} ({item.target})</p>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("engagement")}>
            <h3>Post-wise Analytics</h3>
            <div className="table-like">
              {postAnalytics.length ? (
                postAnalytics.map((item) => (
                  <article className="notice" key={`post-analytics-${item.postId}`}>
                    <strong>{item.title}</strong>
                    <p className="muted">Views: {item.views} | Downloads: {item.downloads} | Shares: {item.shares}</p>
                  </article>
                ))
              ) : (
                <p className="muted">No post analytics yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card" hidden={!isTabActive("engagement")}>
            <h3>Post-wise Feedback</h3>
            <div className="table-like">
              {feedback.length ? (
                feedback.map((item) => (
                  <article className="feedback-card" key={item.id}>
                    <strong>{postTitleById[item.postId] ?? item.postId}</strong>
                    <p className="muted">Rating: {item.rating}/5</p>
                    <p>{item.message}</p>
                    <p className="muted">by {item.userEmail} on {new Date(item.createdAt).toLocaleDateString()}</p>
                  </article>
                ))
              ) : (
                <p className="muted">No feedback submitted yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}















