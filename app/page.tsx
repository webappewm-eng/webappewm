import HomePageClient from "@/components/home/HomePageClient";
import { getCachedHomePageData } from "@/lib/server/page-cache";

export const revalidate = 60;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const data = await getCachedHomePageData();

  return (
    <HomePageClient
      initialCategories={data.categories}
      initialSubtopics={data.subtopics}
      initialPosts={data.posts}
      initialImageSlides={data.imageSlides}
      initialLandingTopics={data.landingTopics}
      initialWebinars={data.webinars}
      initialPreviewPercent={data.previewPercent}
      initialHeroImageSliderEnabled={data.heroImageSliderEnabled}
      requestedCategory={firstParam(params.category).trim().toLowerCase()}
      requestedSubtopic={firstParam(params.subtopic).trim().toLowerCase()}
      requestedSearch={firstParam(params.search)}
    />
  );
}