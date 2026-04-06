"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { getNavigationLinks, getSocialLinks, saveSubscription } from "@/lib/firebase/data";
import { useSiteBootstrap } from "@/components/layout/SiteBootstrapProvider";
import { NavigationLink, SocialLink } from "@/lib/types";
import { fallbackFooterLinks, fallbackSiteChromeSettings } from "@/lib/site/bootstrap";

type PlatformKey =
  | "youtube"
  | "facebook"
  | "x"
  | "instagram"
  | "telegram"
  | "linkedin"
  | "whatsapp"
  | "discord"
  | "github"
  | "website"
  | "default";

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function resolveHref(href: string, pathname: string): string {
  if (href.startsWith("#")) {
    return pathname === "/" ? href : `/${href}`;
  }

  if (!href.startsWith("/") && !isExternalUrl(href)) {
    return `/${href}`;
  }

  return href;
}

function normalizePlatform(value: string): PlatformKey {
  const key = value.trim().toLowerCase();
  if (key === "youtube") return "youtube";
  if (key === "facebook") return "facebook";
  if (key === "x" || key === "twitter") return "x";
  if (key === "instagram") return "instagram";
  if (key === "telegram") return "telegram";
  if (key === "linkedin") return "linkedin";
  if (key === "whatsapp") return "whatsapp";
  if (key === "discord") return "discord";
  if (key === "github") return "github";
  if (key === "website" || key === "web" || key === "site") return "website";
  return "default";
}

function platformColor(platform: PlatformKey): string {
  if (platform === "youtube") return "#FF0033";
  if (platform === "facebook") return "#1877F2";
  if (platform === "x") return "#111111";
  if (platform === "instagram") return "#E4405F";
  if (platform === "telegram") return "#27A7E7";
  if (platform === "linkedin") return "#0A66C2";
  if (platform === "whatsapp") return "#25D366";
  if (platform === "discord") return "#5865F2";
  if (platform === "github") return "#24292E";
  if (platform === "website") return "#FF6B00";
  return "#616161";
}

function PlatformIcon({ platform }: { platform: PlatformKey }) {
  switch (platform) {
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.2" y="6.2" width="17.6" height="11.6" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10.2 9.3L15.4 12L10.2 14.7V9.3Z" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.8 20V13.1H16l.5-2.8h-2.7V8.7c0-.8.4-1.3 1.4-1.3h1.4V5h-2.1c-2.5 0-3.8 1.5-3.8 3.8v1.5H8.5v2.8h2.2V20h3.1Z" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h3.4l3.9 5.4L16.7 4H20l-6 7.1L20.5 20H17l-4.2-5.8L7.5 20H4l6.4-7.7L5 4Z" fill="currentColor" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.3" cy="6.9" r="1.1" fill="currentColor" />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.4 5.2L3.6 11.4c-.9.3-.9 1.5 0 1.8l4 1.3 1.5 4.4c.3.8 1.4.9 1.8.2l2.3-3.5 4.1 3.1c.7.5 1.6.1 1.8-.7l2.4-11.2c.2-1-.7-1.8-1.6-1.5ZM9.7 14.2l7.3-6.4-5.9 7.8-.4 2.1-1-3.5Z" fill="currentColor" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="6" cy="7" r="1.8" fill="currentColor" />
          <rect x="4.4" y="9.4" width="3.2" height="9.8" fill="currentColor" />
          <path d="M10.2 9.4h3v1.3c.5-.8 1.5-1.6 3.1-1.6 2.8 0 3.7 1.8 3.7 4.5v5.6h-3.2v-5.1c0-1.2-.2-2.2-1.6-2.2-1.5 0-1.8 1.2-1.8 2.3v5h-3.2V9.4Z" fill="currentColor" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.2c-4.4 0-7.9 3.5-7.9 7.8 0 1.5.4 2.9 1.2 4.1L4.2 20l4-1.1c1.1.6 2.4 1 3.8 1 4.4 0 7.9-3.5 7.9-7.8s-3.5-7.9-7.9-7.9Zm0 13.9c-1.2 0-2.3-.3-3.2-.9l-.2-.1-2.3.6.6-2.2-.1-.2c-.7-1-.9-2.1-.9-3.3 0-3.3 2.7-5.9 6.1-5.9 3.3 0 6 2.7 6 5.9s-2.7 6.1-6 6.1Zm3.3-4.4c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.4.1-.1.2-.5.7-.6.9-.1.1-.2.2-.4.1-.2-.1-.8-.3-1.5-1-.6-.5-1-1.1-1.1-1.3-.1-.2 0-.3.1-.4.1-.1.2-.2.3-.3.1-.1.1-.2.2-.3.1-.1.1-.3 0-.4 0-.1-.4-1.1-.6-1.5-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.4.1-.6.3-.2.2-.7.7-.7 1.6 0 1 .7 1.9.8 2 .1.1 1.4 2.2 3.3 3 .5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3Z" fill="currentColor" />
        </svg>
      );
    case "discord":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.4 6.7c2-1.4 3.9-1.6 3.9-1.6l.2.3c-1.9.5-2.8 1.2-2.8 1.2 2.9-1.5 6.7-1.5 9.6 0 0 0-.9-.7-2.8-1.2l.2-.3s1.9.2 3.9 1.6c0 0 2.3 3.6 2.3 8 0 0-1.3 2.2-4.6 2.4l-.9-1.2c1.7-.5 2.3-1.5 2.3-1.5-.5.3-1 .6-1.5.8-.8.3-1.5.5-2.2.6-1.2.2-2.3.2-3.4 0-.7-.1-1.4-.3-2.2-.6-.5-.2-1-.4-1.5-.8 0 0 .6 1 2.3 1.5l-.9 1.2c-3.3-.2-4.6-2.4-4.6-2.4 0-4.4 2.3-8 2.3-8Zm4.2 6.5c0-.8-.6-1.5-1.4-1.5s-1.4.7-1.4 1.5c0 .8.6 1.5 1.4 1.5s1.4-.7 1.4-1.5Zm6.2 0c0-.8-.6-1.5-1.4-1.5s-1.4.7-1.4 1.5c0 .8.6 1.5 1.4 1.5s1.4-.7 1.4-1.5Z" fill="currentColor" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.7C7.4 3.7 3.7 7.4 3.7 12c0 3.6 2.3 6.7 5.4 7.8.4.1.5-.2.5-.4v-1.6c-2.2.5-2.7-.9-2.7-.9-.3-.9-.9-1.1-.9-1.1-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.6.1-.5.3-.8.5-1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.3.8.7-.2 1.4-.3 2.1-.3s1.4.1 2.1.3c1.6-1.1 2.3-.8 2.3-.8.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.2.6.8.6 1.6v2.3c0 .2.1.5.5.4 3.1-1.1 5.4-4.2 5.4-7.8 0-4.6-3.7-8.3-8.3-8.3Z" fill="currentColor" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.6 12.4a2.8 2.8 0 0 1 0-4l2.1-2.1a2.8 2.8 0 0 1 4 4l-1 1M15.4 11.6a2.8 2.8 0 0 1 0 4l-2.1 2.1a2.8 2.8 0 0 1-4-4l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function FooterLinkItem({ item, pathname }: { item: NavigationLink; pathname: string }) {
  const href = resolveHref(item.href, pathname);
  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link href={href}>{item.label}</Link>;
  }

  return (
    <a href={href} target={item.openInNewTab ? "_blank" : undefined} rel={item.openInNewTab ? "noreferrer" : undefined}>
      {item.label}
    </a>
  );
}

function SocialItem({ item, floating = false }: { item: SocialLink; floating?: boolean }) {
  const platform = normalizePlatform(item.platform || item.label);
  const style = {
    ["--social-brand" as string]: platformColor(platform)
  } as CSSProperties;

  return (
    <a
      className={`social-link social-link-icon ${floating ? "floating" : ""}`}
      style={style}
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={item.label || item.platform}
      title={item.label || item.platform}
    >
      <span className="social-mark" aria-hidden="true">
        <PlatformIcon platform={platform} />
      </span>
    </a>
  );
}

export function Footer() {
  const pathname = usePathname();
  const bootstrap = useSiteBootstrap();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [footerLinks, setFooterLinks] = useState<NavigationLink[]>(
    bootstrap.footerLinks.length ? bootstrap.footerLinks : fallbackFooterLinks
  );
  const [footerSocialLinks, setFooterSocialLinks] = useState<SocialLink[]>(bootstrap.footerSocialLinks);
  const [floatingSocialLinks, setFloatingSocialLinks] = useState<SocialLink[]>(bootstrap.floatingSocialLinks);
  const [floatingOpen, setFloatingOpen] = useState(true);
  const [siteSettings, setSiteSettings] = useState(
    bootstrap.siteSettings.logoTitleLine1 ? bootstrap.siteSettings : fallbackSiteChromeSettings
  );

  useEffect(() => {
    async function loadLinks() {
      try {
        const rows = await getNavigationLinks("footer");
        if (rows.length) {
          setFooterLinks(rows);
        }
      } catch {
        // Keep server-hydrated links on failure.
      }
    }

    void loadLinks();
  }, []);

  useEffect(() => {
    setSiteSettings(bootstrap.siteSettings);
    if (bootstrap.footerLinks.length) {
      setFooterLinks(bootstrap.footerLinks);
    }
    setFooterSocialLinks(bootstrap.footerSocialLinks);
    setFloatingSocialLinks(bootstrap.floatingSocialLinks);
  }, [bootstrap.footerLinks, bootstrap.footerSocialLinks, bootstrap.floatingSocialLinks, bootstrap.siteSettings]);

  useEffect(() => {
    async function loadSocial() {
      try {
        const [footerSocial, floatingSocial] = await Promise.all([
          getSocialLinks("footer"),
          getSocialLinks("floating")
        ]);

        setFooterSocialLinks(footerSocial);
        setFloatingSocialLinks(floatingSocial);
      } catch {
        // Keep server-hydrated social links on failure.
      }
    }

    void loadSocial();
  }, []);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = window.setTimeout(() => setStatus(""), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

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

  const logoSizeStyle = useMemo(
    () => ({ width: `${siteSettings.logoSize}px`, height: `${siteSettings.logoSize}px` }),
    [siteSettings.logoSize]
  );

  return (
    <>
      {floatingSocialLinks.length ? (
        <aside className={`social-floating ${floatingOpen ? "open" : "collapsed"}`} aria-label="Social media links">
          <button
            type="button"
            className="floating-toggle-btn"
            onClick={() => setFloatingOpen((prev) => !prev)}
            aria-expanded={floatingOpen}
            aria-label={floatingOpen ? "Collapse social links" : "Expand social links"}
            title={floatingOpen ? "Collapse" : "Expand"}
          >
            <span className="floating-toggle-arrow" aria-hidden="true">{floatingOpen ? "<" : ">"}</span>
          </button>
          {floatingOpen
            ? floatingSocialLinks.map((item) => <SocialItem key={`floating-${item.id}`} item={item} floating />)
            : null}
        </aside>
      ) : null}

      {status ? <div className="status-toast">{status}</div> : null}
      <footer className="footer" id="subscribe">
        <div className="footer-inner">
          <div>
            <div className="logo">
              <div className="logo-mark" style={logoSizeStyle}>
                {siteSettings.logoMode === "image" && siteSettings.logoImageUrl ? (
                  <img className="logo-image" src={siteSettings.logoImageUrl} alt="Site logo" />
                ) : (
                  <span className="logo-e">E</span>
                )}
              </div>
              <div className="logo-text">
                <span className="l1">{siteSettings.logoTitleLine1}</span>
                <span className="l2">
                  {siteSettings.logoTitleLine2} <span className="m">{siteSettings.logoAccentText}</span>
                </span>
              </div>
            </div>
            <p className="muted">Real Build. Real Code. Real Engineering.</p>
            {footerSocialLinks.length ? (
              <div className="footer-social-row">
                {footerSocialLinks.map((item) => (
                  <SocialItem key={`footer-social-${item.id}`} item={item} />
                ))}
              </div>
            ) : null}
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
                  <FooterLinkItem item={item} pathname={pathname} />
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
              {status ? <div className="notice" style={{ padding: "0.55rem 0.65rem" }}>{status}</div> : null}
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>(c) 2026 Engineer With Me</span>
          
        </div>
      </footer>
    </>
  );
}








