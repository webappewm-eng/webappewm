"use client";

import Link from "next/link";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

interface ThemedNotFoundProps {
  redirectHref: string;
  buttonLabel: string;
}

export function ThemedNotFound({ redirectHref, buttonLabel }: ThemedNotFoundProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const showHomeButton = redirectHref !== "/";

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => setLoginOpen(true)} />
      <main className="page-main">
        <div className="page-wrap">
          <section className="post-content">
            <div className="post-content-inner not-found-panel">
              <div className="label">Error</div>
              <h1 className="h2" style={{ marginBottom: "0.3rem" }}>
                404 - Page Not Found
              </h1>
              <p className="body-txt">The page you requested does not exist or has been moved.</p>
              <div className="form-actions" style={{ marginTop: "1rem" }}>
                <Link href={redirectHref} className="btn btn-primary">
                  {buttonLabel}
                </Link>
                {showHomeButton ? (
                  <Link href="/" className="btn btn-outline">
                    Go to Home
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
