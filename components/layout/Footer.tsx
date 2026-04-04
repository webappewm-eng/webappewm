"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getNavigationLinks, getSiteSettings, getSocialLinks, saveSubscription } from "@/lib/firebase/data";
import { NavigationLink, SiteSettings, SocialLink } from "@/lib/types";

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

const fallbackSiteSettings: Pick<
  SiteSettings,
  "logoMode" | "logoImageUrl" | "logoSize" | "logoTitleLine1" | "logoTitleLine2" | "logoAccentText"
> = {
  logoMode: "text",
  logoImageUrl: "",
  logoSize: 38,
  logoTitleLine1: "Engineer",
  logoTitleLine2: "With",
  logoAccentText: "Me"
};

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

function getPlatformMark(platform: string, label: string): string {
  const key = platform.trim().toLowerCase();
  if (key === "youtube") return "YT";
  if (key === "instagram") return "IG";
  if (key === "linkedin") return "in";
  if (key === "facebook") return "f";
  if (key === "twitter" || key === "x") return "X";
  if (key === "telegram") return "TG";
  if (key === "whatsapp") return "WA";
  return label.slice(0, 2).toUpperCase() || "SM";
}

function SocialItem({ item, floating = false }: { item: SocialLink; floating?: boolean }) {
  return (
    <a
      className={`social-link ${floating ? "floating" : ""}`}
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={item.label || item.platform}
      title={item.label || item.platform}
    >
      <span className="social-mark">{getPlatformMark(item.platform, item.label)}</span>
      {!floating ? <span>{item.label || item.platform}</span> : null}
    </a>
  );
}

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [footerLinks, setFooterLinks] = useState<NavigationLink[]>(fallbackFooterLinks);
  const [footerSocialLinks, setFooterSocialLinks] = useState<SocialLink[]>([]);
  const [floatingSocialLinks, setFloatingSocialLinks] = useState<SocialLink[]>([]);
  const [siteSettings, setSiteSettings] = useState(fallbackSiteSettings);

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

  useEffect(() => {
    async function loadSettings() {
      try {
        const [settings, footerSocial, floatingSocial] = await Promise.all([
          getSiteSettings(),
          getSocialLinks("footer"),
          getSocialLinks("floating")
        ]);

        setSiteSettings({
          logoMode: settings.logoMode,
          logoImageUrl: settings.logoImageUrl,
          logoSize: settings.logoSize,
          logoTitleLine1: settings.logoTitleLine1,
          logoTitleLine2: settings.logoTitleLine2,
          logoAccentText: settings.logoAccentText
        });
        setFooterSocialLinks(footerSocial);
        setFloatingSocialLinks(floatingSocial);
      } catch {
        setSiteSettings(fallbackSiteSettings);
        setFooterSocialLinks([]);
        setFloatingSocialLinks([]);
      }
    }

    void loadSettings();
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

  const logoSizeStyle = useMemo(
    () => ({ width: `${siteSettings.logoSize}px`, height: `${siteSettings.logoSize}px` }),
    [siteSettings.logoSize]
  );

  return (
    <>
      {floatingSocialLinks.length ? (
        <aside className="social-floating" aria-label="Social media links">
          {floatingSocialLinks.map((item) => (
            <SocialItem key={`floating-${item.id}`} item={item} floating />
          ))}
        </aside>
      ) : null}

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
              {status ? <span className="muted">{status}</span> : null}
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>(c) 2026 Engineer With Me</span>
          <span>PWA enabled - Firebase powered</span>
        </div>
      </footer>
    </>
  );
}
