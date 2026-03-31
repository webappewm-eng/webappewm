import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DesignFrame } from "@/components/design/DesignFrame";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ArticleRenderer } from "@/components/post/ArticleRenderer";
import { getCustomPageBySlug, getCustomPages } from "@/lib/firebase/data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const pages = await getCustomPages(false);
    return pages.map((page) => ({ slug: page.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCustomPageBySlug(slug);

  if (!page) {
    return {
      title: "Page Not Found"
    };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.title
  };
}

export default async function CustomPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = await getCustomPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const showHeader = page.showHeader !== false;
  const showFooter = page.showFooter !== false;
  const contentMode = page.contentMode === "design" ? "design" : "text";

  return (
    <div className="app-shell">
      {showHeader ? <Header /> : null}
      <main className={`page-main ${showHeader ? "" : "page-main-no-nav"}`}>
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / {page.title}
          </p>

          {contentMode === "design" ? (
            <section className="post-content">
              <div className="post-content-inner">
                <h1 className="h2">{page.title}</h1>
                <p className="muted">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
                <DesignFrame html={page.designHtml} css={page.designCss} js={page.designJs} title={page.title} minHeight={620} />
              </div>
            </section>
          ) : (
            <article className="post-content">
              <div className="post-content-inner">
                <h1 className="h2">{page.title}</h1>
                <p className="muted">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
                <ArticleRenderer content={page.content} />
              </div>
            </article>
          )}
        </div>
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
