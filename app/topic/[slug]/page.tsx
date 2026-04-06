import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignFrame } from "@/components/design/DesignFrame";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCachedLandingTopicBySlug, getCachedPublishedLandingTopics } from "@/lib/server/page-cache";

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const topics = await getCachedPublishedLandingTopics();
    return topics.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getCachedLandingTopicBySlug(slug);

  if (!topic) {
    return { title: "Topic Not Found" };
  }

  return {
    title: topic.title,
    description: `Landing page for ${topic.title}`
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = await getCachedLandingTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  const showHeader = topic.showHeader;
  const showFooter = topic.showFooter;

  return (
    <div className={showHeader || showFooter ? "app-shell" : "topic-standalone-shell"}>
      {showHeader ? <Header /> : null}
      <main className={showHeader ? "page-main topic-design-main" : "topic-design-main topic-design-main-no-nav"}>
        <DesignFrame title={topic.title} html={topic.html} css={topic.css} js={topic.js} minHeight={showHeader || showFooter ? 760 : 920} borderless fitContent />
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
