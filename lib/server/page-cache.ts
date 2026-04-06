import "server-only";

import { unstable_cache } from "next/cache";
import {
  getCategories,
  getCommunityAnswersForPublic,
  getCommunityCategories,
  getCommunityQuestionsForPublic,
  getCourseAds,
  getCourseTypes,
  getCourses,
  getCustomPageBySlug,
  getCustomPages,
  getHeroMedia,
  getLandingTopicBySlug,
  getLandingTopics,
  getNavigationLinks,
  getPosts,
  getSiteSettings,
  getSocialLinks,
  getSubtopics,
  getVisitorAnalytics,
  getWebinarBySlug,
  getWebinars
} from "@/lib/firebase/data";
import { SiteBootstrapSnapshot, fallbackSiteBootstrapSnapshot } from "@/lib/site/bootstrap";

interface HomePageData {
  categories: Awaited<ReturnType<typeof getCategories>>;
  subtopics: Awaited<ReturnType<typeof getSubtopics>>;
  posts: Awaited<ReturnType<typeof getPosts>>;
  imageSlides: Awaited<ReturnType<typeof getHeroMedia>>;
  landingTopics: Awaited<ReturnType<typeof getLandingTopics>>;
  webinars: Awaited<ReturnType<typeof getWebinars>>;
  previewPercent: number;
  heroImageSliderEnabled: boolean;
}

interface CommunityPageData {
  settings: Pick<Awaited<ReturnType<typeof getSiteSettings>>, "communityApprovalEnabled">;
  categories: Awaited<ReturnType<typeof getCommunityCategories>>;
  questions: Awaited<ReturnType<typeof getCommunityQuestionsForPublic>>;
  answers: Awaited<ReturnType<typeof getCommunityAnswersForPublic>>;
}

const loadSiteBootstrapSnapshot = unstable_cache(
  async (): Promise<SiteBootstrapSnapshot> => {
    const [settings, headerLinks, footerLinks, footerSocialLinks, floatingSocialLinks, visitorAnalytics] = await Promise.all([
      getSiteSettings(),
      getNavigationLinks("header"),
      getNavigationLinks("footer"),
      getSocialLinks("footer"),
      getSocialLinks("floating"),
      getVisitorAnalytics()
    ]);

    return {
      siteSettings: {
        themeMode: settings.themeMode,
        layoutSideGap: settings.layoutSideGap,
        logoMode: settings.logoMode,
        logoImageUrl: settings.logoImageUrl,
        logoSize: settings.logoSize,
        logoTitleLine1: settings.logoTitleLine1,
        logoTitleLine2: settings.logoTitleLine2,
        logoAccentText: settings.logoAccentText
      },
      headerLinks: headerLinks.length ? headerLinks : fallbackSiteBootstrapSnapshot.headerLinks,
      footerLinks: footerLinks.length ? footerLinks : fallbackSiteBootstrapSnapshot.footerLinks,
      footerSocialLinks,
      floatingSocialLinks,
      visitorCount: visitorAnalytics.totalVisitors
    };
  },
  ["site-bootstrap-snapshot-v1"],
  { revalidate: 30 }
);

const loadHomePageData = unstable_cache(
  async (): Promise<HomePageData> => {
    const [categories, subtopics, posts, imageSlides, landingTopics, webinars, settings] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts(),
      getHeroMedia("image"),
      getLandingTopics(false),
      getWebinars(false),
      getSiteSettings()
    ]);

    return {
      categories,
      subtopics,
      posts,
      imageSlides,
      landingTopics,
      webinars,
      previewPercent: settings.contentPreviewPercent,
      heroImageSliderEnabled: settings.heroImageSliderEnabled
    };
  },
  ["home-page-data-v1"],
  { revalidate: 30 }
);

const loadCommunityPageData = unstable_cache(
  async (): Promise<CommunityPageData> => {
    const [settings, categories, questions, answers] = await Promise.all([
      getSiteSettings(),
      getCommunityCategories(),
      getCommunityQuestionsForPublic(),
      getCommunityAnswersForPublic()
    ]);

    return {
      settings: {
        communityApprovalEnabled: settings.communityApprovalEnabled
      },
      categories,
      questions,
      answers
    };
  },
  ["community-page-data-v1"],
  { revalidate: 30 }
);

const loadCoursesPageData = unstable_cache(
  async () => {
    const [courses, courseTypes] = await Promise.all([getCourses(false), getCourseTypes()]);
    return { courses, courseTypes };
  },
  ["courses-page-data-v1"],
  { revalidate: 60 }
);

const loadPublishedCourses = unstable_cache(async () => getCourses(false), ["courses-published-v1"], { revalidate: 60 });
const loadPublishedCourseTypes = unstable_cache(async () => getCourseTypes(), ["course-types-published-v1"], { revalidate: 60 });
const loadCourseAds = unstable_cache(async () => getCourseAds(), ["course-ads-v1"], { revalidate: 60 });

const loadPublishedLandingTopics = unstable_cache(async () => getLandingTopics(false), ["landing-topics-published-v1"], { revalidate: 60 });
const loadLandingTopicBySlug = unstable_cache(async (slug: string) => getLandingTopicBySlug(slug), ["landing-topic-by-slug-v1"], { revalidate: 60 });

const loadPublishedCustomPages = unstable_cache(async () => getCustomPages(false), ["custom-pages-published-v1"], { revalidate: 60 });
const loadCustomPageBySlug = unstable_cache(async (slug: string) => getCustomPageBySlug(slug), ["custom-page-by-slug-v1"], { revalidate: 60 });

const loadPublishedWebinars = unstable_cache(async () => getWebinars(false), ["webinars-published-v1"], { revalidate: 60 });
const loadWebinarBySlug = unstable_cache(async (slug: string) => getWebinarBySlug(slug), ["webinar-by-slug-v1"], { revalidate: 60 });

export async function getCachedSiteBootstrapSnapshot(): Promise<SiteBootstrapSnapshot> {
  try {
    return await loadSiteBootstrapSnapshot();
  } catch {
    return fallbackSiteBootstrapSnapshot;
  }
}

export async function getCachedHomePageData(): Promise<HomePageData> {
  try {
    return await loadHomePageData();
  } catch {
    return {
      categories: [],
      subtopics: [],
      posts: [],
      imageSlides: [],
      landingTopics: [],
      webinars: [],
      previewPercent: 20,
      heroImageSliderEnabled: false
    };
  }
}

export async function getCachedCommunityPageData(): Promise<CommunityPageData> {
  try {
    return await loadCommunityPageData();
  } catch {
    return {
      settings: { communityApprovalEnabled: true },
      categories: [],
      questions: [],
      answers: []
    };
  }
}

export async function getCachedCoursesPageData() {
  try {
    return await loadCoursesPageData();
  } catch {
    return { courses: [], courseTypes: [] };
  }
}

export async function getCachedPublishedCourses() {
  try {
    return await loadPublishedCourses();
  } catch {
    return [];
  }
}

export async function getCachedPublishedCourseTypes() {
  try {
    return await loadPublishedCourseTypes();
  } catch {
    return [];
  }
}

export async function getCachedCourseAds() {
  try {
    return await loadCourseAds();
  } catch {
    return [];
  }
}

export async function getCachedPublishedLandingTopics() {
  try {
    return await loadPublishedLandingTopics();
  } catch {
    return [];
  }
}

export async function getCachedLandingTopicBySlug(slug: string) {
  try {
    return await loadLandingTopicBySlug(slug.trim().toLowerCase());
  } catch {
    return null;
  }
}

export async function getCachedPublishedCustomPages() {
  try {
    return await loadPublishedCustomPages();
  } catch {
    return [];
  }
}

export async function getCachedCustomPageBySlug(slug: string) {
  try {
    return await loadCustomPageBySlug(slug.trim().toLowerCase());
  } catch {
    return null;
  }
}

export async function getCachedPublishedWebinars() {
  try {
    return await loadPublishedWebinars();
  } catch {
    return [];
  }
}

export async function getCachedWebinarBySlug(slug: string) {
  try {
    return await loadWebinarBySlug(slug.trim().toLowerCase());
  } catch {
    return null;
  }
}

