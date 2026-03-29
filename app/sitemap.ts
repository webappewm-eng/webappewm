import type { MetadataRoute } from "next";
import { getCourses, getCustomPages, getPosts, getSiteSettings, getWebinars } from "@/lib/firebase/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  try {
    const [settings, posts, pages, webinars, courses] = await Promise.all([
      getSiteSettings(),
      getPosts(),
      getCustomPages(false),
      getWebinars(false),
      getCourses(false)
    ]);

    const base = settings.siteUrl.replace(/\/$/, "");

    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: `${base}/`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1
      },
      {
        url: `${base}/webinars`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8
      },
      {
        url: `${base}/courses`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8
      },
      {
        url: `${base}/admin`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.2
      }
    ];

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${base}/post/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8
    }));

    const pageRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
      url: `${base}/pages/${page.slug}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
      changeFrequency: "monthly",
      priority: 0.6
    }));

    const webinarRoutes: MetadataRoute.Sitemap = webinars
      .filter((item) => item.showPublicPage)
      .map((item) => ({
        url: `${base}/webinars/${item.slug}`,
        lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.7
      }));

    const courseRoutes: MetadataRoute.Sitemap = courses.map((item) => ({
      url: `${base}/courses/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7
    }));

    return [...staticRoutes, ...postRoutes, ...pageRoutes, ...webinarRoutes, ...courseRoutes];
  } catch {
    return [
      {
        url: "https://webappewm.vercel.app/",
        lastModified: now,
        changeFrequency: "daily",
        priority: 1
      }
    ];
  }
}
