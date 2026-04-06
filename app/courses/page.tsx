import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCachedCoursesPageData } from "@/lib/server/page-cache";

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

interface CoursesPageProps {
  searchParams?: Promise<{ type?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const requestedType = (params?.type ?? "basics").toString().trim().toLowerCase();

  const { courses, courseTypes } = await getCachedCoursesPageData();

  const enabledTypes = courseTypes.length
    ? courseTypes
    : [
        { id: "fallback-basics", name: "Basics", slug: "basics", order: 1, enabled: true, updatedAt: "" },
        { id: "fallback-free", name: "Free Learning", slug: "free-learning", order: 2, enabled: true, updatedAt: "" },
        { id: "fallback-paid", name: "Paid Course", slug: "paid-course", order: 3, enabled: true, updatedAt: "" }
      ];

  const sortedTypes = [...enabledTypes].sort((a, b) => a.order - b.order);

  const coursesByType = sortedTypes.reduce<Record<string, typeof courses>>((acc, typeItem) => {
    acc[typeItem.slug] = courses.filter((course) => course.typeSlug === typeItem.slug);
    return acc;
  }, {});

  const showAll = !requestedType || requestedType === "basics" || requestedType === "all";
  const filteredCourses = showAll ? courses : courses.filter((item) => item.typeSlug === requestedType);
  const activeTypeLabel = showAll
    ? "Basics (All Courses)"
    : sortedTypes.find((item) => item.slug === requestedType)?.name ?? requestedType;

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <section className="section courses-page-shell">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Courses
          </p>

          <div className="label">Certification</div>
          <h1 className="h2">Courses and Certification Programs</h1>
          <p className="body-txt">Complete lessons, unlock tests, and download certificates.</p>

          <div className="courses-page-layout">
            <aside className="courses-sidebar-tree">
              {sortedTypes.map((typeItem) => {
                const typeCourses = coursesByType[typeItem.slug] ?? [];
                const typeActive = (showAll && typeItem.slug === "basics") || (!showAll && requestedType === typeItem.slug);
                const typeHref = `/courses?type=${encodeURIComponent(typeItem.slug)}`;

                return (
                  <div key={`sidebar-type-${typeItem.id}`} className="courses-type-block">
                    <Link href={typeHref} className={`courses-type-link ${typeActive ? "active" : ""}`}>
                      {typeItem.slug === "basics" ? "Basics (All)" : typeItem.name}
                    </Link>

                    {typeCourses.length ? (
                      <div className="courses-tree-list">
                        {typeCourses.map((course) => (
                          <div key={`sidebar-course-${course.id}`} className="courses-tree-course">
                            <Link href={`/courses/${course.slug}`} className="courses-tree-course-link">
                              {course.title}
                            </Link>
                            {course.lessons.length ? (
                              <ul className="courses-tree-sections">
                                {course.lessons.slice(0, 5).map((lesson) => (
                                  <li key={`${course.id}-${lesson.id}`}>{lesson.title}</li>
                                ))}
                                {course.lessons.length > 5 ? <li>+{course.lessons.length - 5} more sections</li> : null}
                              </ul>
                            ) : (
                              <p className="muted courses-tree-empty">No sections yet</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted courses-tree-empty">No courses yet</p>
                    )}
                  </div>
                );
              })}
            </aside>

            <div>
              <p className="muted" style={{ marginTop: "0.2rem" }}>
                Showing: <strong>{activeTypeLabel}</strong>
              </p>

              <div className="card-grid courses-page-grid" style={{ marginTop: "1.1rem" }}>
                {filteredCourses.length ? (
                  filteredCourses.map((item) => (
                    <article className="post-card" key={item.id}>
                      <Image src={safeImage(item.coverImage)} alt={item.title} width={1200} height={700} />
                      <h3>{item.title}</h3>
                      <p className="meta">
                        {item.lessons.length} lessons | Pass mark {item.passingScore}%
                      </p>
                      <p className="muted">Type: {item.typeSlug === "basics" ? "Basics" : item.typeSlug}</p>
                      <p className="muted">{item.description}</p>
                      <Link href={`/courses/${item.slug}`} className="btn btn-primary" style={{ marginTop: "0.8rem" }}>
                        Start Course
                      </Link>
                    </article>
                  ))
                ) : (
                  <div className="notice courses-empty">No courses available for this type yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}