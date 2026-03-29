import HomePageClient from "@/components/home/HomePageClient";
import { getCategories, getCourses, getHeroMedia, getPosts, getSiteSettings, getSubtopics, getWebinars } from "@/lib/firebase/data";
import { Category, Course, HeroMediaItem, Post, Subtopic, Webinar } from "@/lib/types";

export const revalidate = 60;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

async function loadHomeData(): Promise<{
  categories: Category[];
  subtopics: Subtopic[];
  posts: Post[];
  videoSlides: HeroMediaItem[];
  imageSlides: HeroMediaItem[];
  webinars: Webinar[];
  courses: Course[];
  previewPercent: number;
}> {
  try {
    const [categories, subtopics, posts, videoSlides, imageSlides, webinars, courses, settings] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts(),
      getHeroMedia("video"),
      getHeroMedia("image"),
      getWebinars(false),
      getCourses(false),
      getSiteSettings()
    ]);

    return {
      categories,
      subtopics,
      posts,
      videoSlides,
      imageSlides,
      webinars,
      courses,
      previewPercent: settings.contentPreviewPercent
    };
  } catch {
    return {
      categories: [],
      subtopics: [],
      posts: [],
      videoSlides: [],
      imageSlides: [],
      webinars: [],
      courses: [],
      previewPercent: 20
    };
  }
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const data = await loadHomeData();

  return (
    <HomePageClient
      initialCategories={data.categories}
      initialSubtopics={data.subtopics}
      initialPosts={data.posts}
      initialVideoSlides={data.videoSlides}
      initialImageSlides={data.imageSlides}
      initialWebinars={data.webinars}
      initialCourses={data.courses}
      initialPreviewPercent={data.previewPercent}
      requestedCategory={firstParam(params.category).trim().toLowerCase()}
      requestedSubtopic={firstParam(params.subtopic).trim().toLowerCase()}
      requestedSearch={firstParam(params.search)}
    />
  );
}
