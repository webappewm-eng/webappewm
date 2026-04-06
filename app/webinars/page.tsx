import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCachedPublishedWebinars } from "@/lib/server/page-cache";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Webinars",
  description: "Live engineering webinars"
};

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

export default async function WebinarsPage() {
  const webinars = await getCachedPublishedWebinars();

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Webinars
          </p>

          <section className="section" style={{ paddingInline: 0, paddingTop: "0.5rem" }}>
            <div className="label">Webinars</div>
            <h1 className="h2">Upcoming Live Sessions</h1>
            <p className="body-txt">Join topic-based live sessions and register with one click.</p>

            <div className="card-grid" style={{ marginTop: "1.1rem" }}>
              {webinars.length ? (
                webinars
                  .filter((item) => item.showPublicPage)
                  .map((item) => (
                    <article className="post-card" key={item.id}>
                      <Image src={safeImage(item.bannerImage)} alt={item.title} width={1200} height={700} />
                      <h3>{item.title}</h3>
                      <p className="meta">{new Date(item.startAt).toLocaleString()}</p>
                      <p className="muted">{item.description}</p>
                      <Link href={`/webinars/${item.slug}`} className="btn btn-primary" style={{ marginTop: "0.8rem" }}>
                        Register
                      </Link>
                    </article>
                  ))
              ) : (
                <div className="notice">No webinars published yet.</div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


