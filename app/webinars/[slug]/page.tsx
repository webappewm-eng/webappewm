import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WebinarDetailClient } from "@/components/webinars/WebinarDetailClient";
import { getWebinarBySlug, getWebinars } from "@/lib/firebase/data";

export const revalidate = 60;
export const dynamicParams = true;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1400&q=80";

function safeImage(url: string): string {
  const value = url.trim();
  if (!value) {
    return FALLBACK_IMAGE;
  }
  if (value.startsWith("/") || /^https?:\/\//i.test(value)) {
    return value;
  }
  return FALLBACK_IMAGE;
}

export async function generateStaticParams() {
  try {
    const webinars = await getWebinars(false);
    return webinars.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarBySlug(slug).catch(() => null);

  if (!webinar || !webinar.showPublicPage) {
    return { title: "Webinar Not Found" };
  }

  return {
    title: webinar.title,
    description: webinar.description,
    openGraph: {
      title: webinar.title,
      description: webinar.description,
      images: [{ url: safeImage(webinar.bannerImage) }]
    }
  };
}

export default async function WebinarDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const webinar = await getWebinarBySlug(slug).catch(() => null);

  if (!webinar || !webinar.showPublicPage) {
    notFound();
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/webinars">Webinars</Link> / {webinar.title}
          </p>

          <article className="post-hero">
            <Image src={safeImage(webinar.bannerImage)} alt={webinar.title} width={1400} height={780} />
            <div className="post-header">
              <div className="label">Live Webinar</div>
              <h1>{webinar.title}</h1>
              <p className="meta">{webinar.description}</p>
              <p className="muted">
                Starts: {new Date(webinar.startAt).toLocaleString()} | Ends: {new Date(webinar.endAt).toLocaleString()}
              </p>
            </div>
          </article>

          <WebinarDetailClient webinar={webinar} />
        </div>
      </main>
      <Footer />
    </div>
  );
}


