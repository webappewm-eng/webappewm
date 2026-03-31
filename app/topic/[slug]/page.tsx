import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DesignFrame } from "@/components/design/DesignFrame";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getLandingTopicBySlug, getLandingTopics } from "@/lib/firebase/data";

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const topics = await getLandingTopics(false);
    return topics.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getLandingTopicBySlug(slug);

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
  const topic = await getLandingTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  const showHeader = topic.showHeader;
  const showFooter = topic.showFooter;

  return (
    <div className="app-shell">
      {showHeader ? <Header /> : null}
      <main className={`page-main ${showHeader ? "" : "page-main-no-nav"}`}>
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Topic
          </p>
          <section className="post-content">
            <div className="post-content-inner">
              <h1 className="h2">{topic.title}</h1>
              <p className="muted">Updated {new Date(topic.updatedAt).toLocaleDateString()}</p>
              <DesignFrame title={topic.title} html={topic.html} css={topic.css} js={topic.js} minHeight={640} />
            </div>
          </section>
        </div>
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
