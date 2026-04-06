import CommunityPageClient from "@/components/community/CommunityPageClient";
import {
  getCommunityAnswersForPublic,
  getCommunityCategories,
  getCommunityQuestionsForPublic,
  getSiteSettings
} from "@/lib/firebase/data";

export const revalidate = 30;

export default async function CommunityPage() {
  try {
    const [settings, categories, questions, answers] = await Promise.all([
      getSiteSettings(),
      getCommunityCategories(),
      getCommunityQuestionsForPublic(),
      getCommunityAnswersForPublic()
    ]);

    return (
      <CommunityPageClient
        initialSettings={{ communityApprovalEnabled: settings.communityApprovalEnabled }}
        initialCategories={categories}
        initialQuestions={questions}
        initialAnswers={answers}
      />
    );
  } catch {
    return <CommunityPageClient />;
  }
}
