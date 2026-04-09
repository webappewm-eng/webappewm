import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignFrame } from "@/components/design/DesignFrame";
import { getCachedPublishedCourses } from "@/lib/server/page-cache";

export const revalidate = 60;
export const dynamicParams = true;

interface CourseCustomLandingPageProps {
  params: Promise<{ slug: string; customSlug: string }>;
}

export async function generateStaticParams() {
  try {
    const courses = await getCachedPublishedCourses();
    return courses
      .filter((item) => item.customLandingEnabled === true && (item.customLandingSlug ?? "") && (item.landingHtml ?? "").trim())
      .map((item) => ({ slug: item.slug, customSlug: item.customLandingSlug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CourseCustomLandingPageProps): Promise<Metadata> {
  const { slug, customSlug } = await params;
  const courses = await getCachedPublishedCourses();

  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedCustomSlug = customSlug.trim().toLowerCase();

  const course = courses.find((item) => item.slug.toLowerCase() === normalizedSlug) ?? null;
  if (!course) {
    return { title: "Course Landing Not Found" };
  }

  if (
    !course.customLandingEnabled ||
    !(course.landingHtml ?? "").trim() ||
    (course.customLandingSlug ?? "").trim().toLowerCase() !== normalizedCustomSlug
  ) {
    return { title: `${course.title} | Landing Not Found` };
  }

  return {
    title: `${course.title} | Landing Page`,
    description: course.description
  };
}

export default async function CourseCustomLandingPage({ params }: CourseCustomLandingPageProps) {
  const { slug, customSlug } = await params;
  const courses = await getCachedPublishedCourses();

  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedCustomSlug = customSlug.trim().toLowerCase();

  const course = courses.find((item) => item.slug.toLowerCase() === normalizedSlug) ?? null;
  if (!course) {
    notFound();
  }

  const slugMatches = (course.customLandingSlug ?? "").trim().toLowerCase() === normalizedCustomSlug;
  if (!course.customLandingEnabled || !slugMatches || !(course.landingHtml ?? "").trim()) {
    notFound();
  }

  return (
    <div className="topic-standalone-shell">
      <main className="topic-design-main topic-design-main-no-nav">
        <DesignFrame
          title={`${course.title} landing`}
          html={course.landingHtml}
          css={course.landingCss}
          js={course.landingJs}
          minHeight={920}
          borderless
          fitContent
        />
      </main>
    </div>
  );
}


