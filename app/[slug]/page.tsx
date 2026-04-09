import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomPageRouteView } from "@/components/pages/CustomPageRouteView";
import { getCachedCustomPageBySlug, getCachedPublishedCustomPages } from "@/lib/server/page-cache";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const pages = await getCachedPublishedCustomPages("direct");
    return pages.map((page) => ({ slug: page.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCachedCustomPageBySlug(slug, "direct");

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

export default async function DirectLandingPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = await getCachedCustomPageBySlug(slug, "direct");

  if (!page) {
    notFound();
  }

  return <CustomPageRouteView page={page} />;
}