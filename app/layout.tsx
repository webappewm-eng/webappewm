import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LiveTracker } from "@/components/layout/LiveTracker";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { ThirdPartyScripts } from "@/components/layout/ThirdPartyScripts";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { getSiteSettings } from "@/lib/firebase/data";

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
  let themeMode: "light" | "dark" = "light";
  let layoutSideGap = 32;

  try {
    const settings = await getSiteSettings();
    themeMode = settings.themeMode;
    layoutSideGap = settings.layoutSideGap;
  } catch {
    themeMode = "light";
    layoutSideGap = 32;
  }

  return (
    <html lang="en" data-theme={themeMode} style={{ "--container-pad": `${layoutSideGap}px` } as CSSProperties}>
      <body>
        <AuthProvider>
          <PwaRegister />
          <LiveTracker />
          <ThirdPartyScripts />
          <ThemeSync />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
