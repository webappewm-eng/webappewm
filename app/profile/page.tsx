import type { Metadata } from "next";
import Link from "next/link";
import { AccountPageClient } from "@/components/account/AccountPageClient";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile, password, learning progress, and certificates"
};

export const revalidate = 30;

export default function ProfilePage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Profile
          </p>
          <h1 className="h2">Manage Your Account</h1>
          <p className="body-txt">Update your name, date of birth, city, password, completed courses, and achieved certificates after login.</p>

          <div style={{ marginTop: "1rem" }}>
            <AccountPageClient />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
