import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCourses } from "@/lib/firebase/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Courses",
  description: "Certification courses"
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80";

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

export default async function CoursesPage() {
  const courses = await getCourses(false).catch(() => []);

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Courses
          </p>

          <section className="section" style={{ paddingInline: 0, paddingTop: "0.5rem" }}>
            <div className="label">Certification</div>
            <h1 className="h2">Courses and Certification Programs</h1>
            <p className="body-txt">Complete lessons, unlock tests, and download certificates.</p>

            <div className="card-grid" style={{ marginTop: "1.1rem" }}>
              {courses.length ? (
                courses.map((item) => (
                  <article className="post-card" key={item.id}>
                    <Image src={safeImage(item.coverImage)} alt={item.title} width={1200} height={700} />
                    <h3>{item.title}</h3>
                    <p className="meta">{item.lessons.length} lessons | Pass mark {item.passingScore}%</p>
                    <p className="muted">{item.description}</p>
                    <Link href={`/courses/${item.slug}`} className="btn btn-primary" style={{ marginTop: "0.8rem" }}>
                      Start Course
                    </Link>
                  </article>
                ))
              ) : (
                <div className="notice">No courses published yet.</div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


