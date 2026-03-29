import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/firebase/data";

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const settings = await getSiteSettings();
    const host = settings.siteUrl.replace(/\/$/, "");

    return {
      rules: settings.robotsIndexable
        ? {
            userAgent: "*",
            allow: "/"
          }
        : {
            userAgent: "*",
            disallow: "/"
          },
      sitemap: `${host}/sitemap.xml`
    };
  } catch {
    return {
      rules: {
        userAgent: "*",
        allow: "/"
      },
      sitemap: "https://webappewm.vercel.app/sitemap.xml"
    };
  }
}
