"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getNavigationLinks, saveSubscription } from "@/lib/firebase/data";
import { NavigationLink } from "@/lib/types";

const fallbackFooterLinks: NavigationLink[] = [
  {
    id: "fallback-footer-terms",
    label: "Terms and Conditions",
    href: "/pages/terms-and-conditions",
    location: "footer",
    order: 1,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-footer-privacy",
    label: "Privacy Policy",
    href: "/pages/privacy-policy",
    location: "footer",
    order: 2,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-footer-about",
    label: "About",
    href: "/pages/about",
    location: "footer",
    order: 3,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  }
];

function FooterLinkItem({ item }: { item: NavigationLink }) {
  if (item.href.startsWith("/")) {
    return <Link href={item.href}>{item.label}</Link>;
  }

  return (
    <a href={item.href} target={item.openInNewTab ? "_blank" : undefined} rel={item.openInNewTab ? "noreferrer" : undefined}>
      {item.label}
    </a>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [footerLinks, setFooterLinks] = useState<NavigationLink[]>(fallbackFooterLinks);

  useEffect(() => {
    async function loadLinks() {
      try {
        const rows = await getNavigationLinks("footer");
        if (rows.length) {
          setFooterLinks(rows);
        }
      } catch {
        setFooterLinks(fallbackFooterLinks);
      }
    }

    void loadLinks();
  }, []);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!email.trim()) {
      setStatus("Enter an email first.");
      return;
    }

    try {
      await saveSubscription(email);
      setStatus("Subscribed successfully.");
      setEmail("");
    } catch {
      setStatus("Subscription failed. Try again.");
    }
  }

  return (
    <footer className="footer" id="subscribe">
      <div className="footer-inner">
        <div>
          <div className="logo">
            <div className="logo-mark">
              <span className="logo-e">E</span>
            </div>
            <div className="logo-text">
              <span className="l1">Engineer</span>
              <span className="l2">
                With <span className="m">Me</span>
              </span>
            </div>
          </div>
          <p className="muted">Real Build. Real Code. Real Engineering.</p>
        </div>

        <div>
          <h4>Foundations</h4>
          <ul>
            <li>Science</li>
            <li>Mathematics</li>
            <li>Mechanical</li>
            <li>Electronics</li>
          </ul>
        </div>

        <div>
          <h4>Pages</h4>
          <ul>
            {footerLinks.map((item) => (
              <li key={item.id}>
                <FooterLinkItem item={item} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Newsletter</h4>
          <form className="subscription-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
            {status ? <span className="muted">{status}</span> : null}
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <span>(c) 2026 Engineer With Me</span>
        <span>PWA enabled - Firebase powered</span>
      </div>
    </footer>
  );
}
