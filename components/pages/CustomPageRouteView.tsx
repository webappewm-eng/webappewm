import Link from "next/link";
import { DesignFrame } from "@/components/design/DesignFrame";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ArticleRenderer } from "@/components/post/ArticleRenderer";
import type { CustomPage } from "@/lib/types";

interface CustomPageRouteViewProps {
  page: CustomPage;
  breadcrumbLabel?: string;
}

export function CustomPageRouteView({ page, breadcrumbLabel }: CustomPageRouteViewProps) {
  const contentMode = page.contentMode === "design" ? "design" : "text";

  if (contentMode === "design") {
    return <DesignFrame html={page.designHtml} css={page.designCss} js={page.designJs} title={page.title} minHeight={620} />;
  }

  const showHeader = page.showHeader !== false;
  const showFooter = page.showFooter !== false;

  return (
    <div className="app-shell">
      {showHeader ? <Header /> : null}
      <main className={`page-main ${showHeader ? "" : "page-main-no-nav"}`}>
        <div className="page-wrap">
          {breadcrumbLabel ? (
            <p className="breadcrumb">
              <Link href="/">Home</Link> / {breadcrumbLabel}
            </p>
          ) : null}

          <article className="post-content">
            <div className="post-content-inner">
              <h1 className="h2">{page.title}</h1>
              <p className="muted">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
              <ArticleRenderer content={page.content} />
            </div>
          </article>
        </div>
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}