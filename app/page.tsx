import HomePageClient from "@/components/home/HomePageClient";
import { getCategories, getHeroMedia, getPosts, getSiteSettings, getSubtopics, getWebinars } from "@/lib/firebase/data";
import { Category, HeroMediaItem, Post, Subtopic, Webinar } from "@/lib/types";

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
  imageSlides: HeroMediaItem[];
  webinars: Webinar[];
  previewPercent: number;
  heroImageSliderEnabled: boolean;
}> {
  try {
    const [categories, subtopics, posts, imageSlides, webinars, settings] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts(),
      getHeroMedia("image"),
      getWebinars(false),
      getSiteSettings()
    ]);

    return {
      categories,
      subtopics,
      posts,
      imageSlides,
      webinars,
      previewPercent: settings.contentPreviewPercent,
      heroImageSliderEnabled: settings.heroImageSliderEnabled
    };
  } catch {
    return {
      categories: [],
      subtopics: [],
      posts: [],
      imageSlides: [],
      webinars: [],
      previewPercent: 20,
      heroImageSliderEnabled: false
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
      initialImageSlides={data.imageSlides}
      initialWebinars={data.webinars}
      initialPreviewPercent={data.previewPercent}
      initialHeroImageSliderEnabled={data.heroImageSliderEnabled}
      requestedCategory={firstParam(params.category).trim().toLowerCase()}
      requestedSubtopic={firstParam(params.subtopic).trim().toLowerCase()}
      requestedSearch={firstParam(params.search)}
    />
  );
}
