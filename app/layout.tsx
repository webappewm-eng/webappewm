import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LiveTracker } from "@/components/layout/LiveTracker";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { ThirdPartyScripts } from "@/components/layout/ThirdPartyScripts";

export const metadata: Metadata = {
  title: "Engineer With Me",
  description: "Real Build. Real Code. Real Engineering.",
  applicationName: "Engineer With Me",
  keywords: ["blog", "electronics", "engineering", "nextjs", "firebase"]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AuthProvider>
          <PwaRegister />
          <LiveTracker />
          <ThirdPartyScripts />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
