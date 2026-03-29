"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logoutUser } from "@/lib/firebase/auth";
import { getNavigationLinks, getSiteSettings } from "@/lib/firebase/data";
import { useAuth } from "@/components/auth/AuthProvider";
import { NavigationLink, SiteSettings } from "@/lib/types";

interface HeaderProps {
  onOpenLogin: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const fallbackHeaderLinks: NavigationLink[] = [
  {
    id: "fallback-header-categories",
    label: "Categories",
    href: "#categories",
    location: "header",
    order: 1,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-header-topics",
    label: "Topics",
    href: "#topics",
    location: "header",
    order: 2,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-header-subscribe",
    label: "Subscribe",
    href: "#subscribe",
    location: "header",
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

function LinkItem({ item, pathname }: { item: NavigationLink; pathname: string }) {
  const href = resolveHref(item.href, pathname);
  const isPath = href.startsWith("/") || href.startsWith("#");

  if (isPath) {
    return (
      <Link className="nav-link" href={href}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      className="nav-link"
      href={href}
      target={item.openInNewTab ? "_blank" : undefined}
      rel={item.openInNewTab ? "noreferrer" : undefined}
    >
      {item.label}
    </a>
  );
}

export function Header({ onOpenLogin, searchValue = "", onSearchChange }: HeaderProps) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [menuLinks, setMenuLinks] = useState<NavigationLink[]>(fallbackHeaderLinks);
  const [siteSettings, setSiteSettings] = useState(fallbackSiteSettings);

  useEffect(() => {
    async function loadLinks() {
      try {
        const rows = await getNavigationLinks("header");
        if (rows.length) {
          setMenuLinks(rows);
        }
      } catch {
        setMenuLinks(fallbackHeaderLinks);
      }
    }

    void loadLinks();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSiteSettings();
        setSiteSettings({
          logoMode: settings.logoMode,
          logoImageUrl: settings.logoImageUrl,
          logoSize: settings.logoSize,
          logoTitleLine1: settings.logoTitleLine1,
          logoTitleLine2: settings.logoTitleLine2,
          logoAccentText: settings.logoAccentText
        });
      } catch {
        setSiteSettings(fallbackSiteSettings);
      }
    }

    void loadSettings();
  }, []);

  const logoSizeStyle = useMemo(
    () => ({ width: `${siteSettings.logoSize}px`, height: `${siteSettings.logoSize}px` }),
    [siteSettings.logoSize]
  );

  return (
    <header className="nav">
      <Link href="/" className="logo">
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
      </Link>

      <nav className="nav-links">
        {menuLinks.map((item) => (
          <LinkItem key={item.id} item={item} pathname={pathname} />
        ))}
      </nav>

      {onSearchChange ? (
        <input
          className="nav-search"
          type="search"
          placeholder="Search topics"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      ) : null}

      <div className="nav-links">
        {profile?.isAdmin ? (
          <Link href="/admin" className="nav-btn secondary">
            Admin
          </Link>
        ) : null}
        {profile ? (
          <button
            className="nav-btn secondary"
            onClick={() => {
              void logoutUser();
            }}
          >
            Logout
          </button>
        ) : (
          <button className="nav-btn" onClick={onOpenLogin}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}
