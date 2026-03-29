import type { Metadata } from "next";
import type { ReactNode } from "react";
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
      metadataBase: new URL("https://webappewm.vercel.app")
    };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let themeMode: "light" | "dark" = "light";

  try {
    const settings = await getSiteSettings();
    themeMode = settings.themeMode;
  } catch {
    themeMode = "light";
  }

  return (
    <html lang="en" data-theme={themeMode}>
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

