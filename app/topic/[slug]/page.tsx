import type { Metadata } from "next";
import Link from "next/link";
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
    description: topic.description || `Landing page for ${topic.title}`
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
  const topicDescription = topic.description.trim();
  const canShowDescription = topic.showDescription && Boolean(topicDescription);
  const showMeta = topic.showBreadcrumb || topic.showTitle || canShowDescription || topic.showActionButton;
  const actionButtonLabel = topic.actionButtonLabel.trim() || "Open Topic";
  const actionButtonUrl = topic.actionButtonUrl.trim();
  const isExternalActionButtonUrl = /^https?:\/\//i.test(actionButtonUrl);

  return (
    <div className={showHeader || showFooter ? "app-shell" : "topic-standalone-shell"}>
      {showHeader ? <Header /> : null}
      <main className={showHeader ? "page-main topic-design-main" : "topic-design-main topic-design-main-no-nav"}>
        {showMeta ? (
          <div className="page-wrap topic-meta-wrap">
            {topic.showBreadcrumb ? (
              <p className="breadcrumb">
                <Link href="/">Home</Link> / Topic / {topic.title}
              </p>
            ) : null}
            {topic.showTitle ? <h1 className="h2">{topic.title}</h1> : null}
            {canShowDescription ? <p className="topic-meta-description">{topicDescription}</p> : null}
            {topic.showActionButton ? (
              <div className="topic-meta-actions">
                {actionButtonUrl ? (
                  <a
                    className="btn btn-primary"
                    href={actionButtonUrl}
                    target={isExternalActionButtonUrl ? "_blank" : undefined}
                    rel={isExternalActionButtonUrl ? "noreferrer" : undefined}
                  >
                    {actionButtonLabel}
                  </a>
                ) : (
                  <button className="btn btn-primary" type="button">
                    {actionButtonLabel}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        <DesignFrame title={topic.title} html={topic.html} css={topic.css} js={topic.js} minHeight={showHeader || showFooter ? 760 : 920} borderless fitContent />
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
