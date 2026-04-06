import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LiveTracker } from "@/components/layout/LiveTracker";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { SiteBootstrapProvider } from "@/components/layout/SiteBootstrapProvider";
import { ThirdPartyScripts } from "@/components/layout/ThirdPartyScripts";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { getSiteSettings } from "@/lib/firebase/data";
import { getCachedSiteBootstrapSnapshot } from "@/lib/server/page-cache";

function toMetadataBase(siteUrl: string): URL {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("https://webappewm.vercel.app");
  }
}

const sharedIcons: Metadata["icons"] = {
  icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  shortcut: ["/icon.svg"],
  apple: [{ url: "/icon.svg" }]
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    return {
      title: {
        default: settings.defaultSeoTitle,
        template: `%s | ${settings.defaultSeoTitle}`
      },
      description: settings.defaultSeoDescription,
      applicationName: "Engineer With Me",
      keywords: ["blog", "electronics", "engineering", "nextjs", "firebase"],
      metadataBase: toMetadataBase(settings.siteUrl),
      icons: sharedIcons,
      openGraph: {
        title: settings.defaultSeoTitle,
        description: settings.defaultSeoDescription,
        images: settings.defaultOgImage ? [{ url: settings.defaultOgImage }] : undefined,
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: settings.defaultSeoTitle,
        description: settings.defaultSeoDescription,
        images: settings.defaultOgImage ? [settings.defaultOgImage] : undefined
      }
    };
  } catch {
    return {
      title: "Engineer With Me",
      description: "Real Build. Real Code. Real Engineering.",
      applicationName: "Engineer With Me",
      keywords: ["blog", "electronics", "engineering", "nextjs", "firebase"],
      metadataBase: new URL("https://webappewm.vercel.app"),
      icons: sharedIcons
    };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const bootstrap = await getCachedSiteBootstrapSnapshot();
  const themeMode = bootstrap.siteSettings.themeMode;
  const layoutSideGap = bootstrap.siteSettings.layoutSideGap;

  return (
    <html lang="en" data-theme={themeMode} style={{ "--container-pad": `${layoutSideGap}px` } as CSSProperties}>
      <body>
        <AuthProvider>
          <SiteBootstrapProvider snapshot={bootstrap}>
            <PwaRegister />
            <LiveTracker />
            <ThirdPartyScripts />
            <ThemeSync />
            {children}
          </SiteBootstrapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}