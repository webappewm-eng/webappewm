import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CourseDetailClient } from "@/components/courses/CourseDetailClient";
import { getCachedCourseAds, getCachedPublishedCourses } from "@/lib/server/page-cache";

export const revalidate = 60;
export const dynamicParams = true;

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

export async function generateStaticParams() {
  try {
    const courses = await getCachedPublishedCourses();
    return courses.map((item) => ({ slug: item.slug }));
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
  const courses = await getCachedPublishedCourses();
  const normalized = slug.trim().toLowerCase();
  const course = courses.find((item) => item.slug.toLowerCase() === normalized) ?? null;

  if (!course) {
    return { title: "Course Not Found" };
  }

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [{ url: safeImage(course.coverImage) }]
    }
  };
}

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalized = slug.trim().toLowerCase();

  const [courses, courseAds] = await Promise.all([
    getCachedPublishedCourses(),
    getCachedCourseAds()
  ]);

  const course = courses.find((item) => item.slug.toLowerCase() === normalized) ?? null;

  if (!course) {
    notFound();
  }

  const selectedAds = course.adsEnabled
    ? courseAds.filter((item) => item.enabled && course.adIds.includes(item.id))
    : [];

  const currentIndex = courses.findIndex((item) => item.id === course.id);
  const nextCourse =
    currentIndex >= 0 && currentIndex < courses.length - 1
      ? { slug: courses[currentIndex + 1].slug, title: courses[currentIndex + 1].title }
      : null;

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/courses">Courses</Link> / {course.title}
          </p>

          <article className="post-hero">
            <Image src={safeImage(course.coverImage)} alt={course.title} width={1400} height={780} />
            <div className="post-header">
              <div className="label">Certification Program</div>
              <h1>{course.title}</h1>
              <p className="meta">{course.description}</p>
              <p className="muted">Lessons: {course.lessons.length} | Pass mark: {course.passingScore}%</p>
            </div>
          </article>

          <CourseDetailClient course={course} ads={selectedAds} nextCourse={nextCourse} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
