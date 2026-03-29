import HomePageClient from "@/components/home/HomePageClient";
import { getCategories, getPosts, getSubtopics } from "@/lib/firebase/data";
import { Category, Post, Subtopic } from "@/lib/types";

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
}> {
  try {
    const [categories, subtopics, posts] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts()
    ]);

    return { categories, subtopics, posts };
  } catch {
    return { categories: [], subtopics: [], posts: [] };
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
      requestedCategory={firstParam(params.category).trim().toLowerCase()}
      requestedSubtopic={firstParam(params.subtopic).trim().toLowerCase()}
    />
  );
}
