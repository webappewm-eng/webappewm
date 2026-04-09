import CommunityPageClient from "@/components/community/CommunityPageClient";
import { getCachedCommunityPageData } from "@/lib/server/page-cache";

export const revalidate = 30;

export default async function CommunityPage() {
  const data = await getCachedCommunityPageData();

  return (
    <CommunityPageClient
      initialSettings={data.settings}
      initialCategories={data.categories}
      initialQuestions={data.questions}
      initialAnswers={data.answers}
    />
  );
}
