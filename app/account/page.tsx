import type { Metadata } from "next";
import Link from "next/link";
import { AccountPageClient } from "@/components/account/AccountPageClient";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage profile, progress, and certificates"
};

export const revalidate = 30;

export default function AccountPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Account
          </p>
          <div className="label">Account</div>
          <h1 className="h2">Profile and Learning Dashboard</h1>
          <p className="body-txt">Update your profile, change password, and view completed courses with certificates.</p>

          <div style={{ marginTop: "1rem" }}>
            <AccountPageClient />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
