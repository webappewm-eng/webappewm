import type { MetadataRoute } from "next";
import { getCustomPages, getPosts, getSiteSettings } from "@/lib/firebase/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  try {
    const [settings, posts, pages] = await Promise.all([getSiteSettings(), getPosts(), getCustomPages(false)]);
    const base = settings.siteUrl.replace(/\/$/, "");

    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: `${base}/`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1
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

    return [...staticRoutes, ...postRoutes, ...pageRoutes];
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
