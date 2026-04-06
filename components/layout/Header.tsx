"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";
import { useSiteBootstrap } from "@/components/layout/SiteBootstrapProvider";
import { logoutUser } from "@/lib/firebase/auth";
import { getNavigationLinks, getVisitorAnalytics } from "@/lib/firebase/data";
import { NavigationLink } from "@/lib/types";
import { fallbackHeaderLinks, fallbackSiteChromeSettings } from "@/lib/site/bootstrap";

interface HeaderProps {
  onOpenLogin?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

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

function MenuLink({
  item,
  pathname,
  childrenLinks
}: {
  item: NavigationLink;
  pathname: string;
  childrenLinks: NavigationLink[];
}) {
  const href = resolveHref(item.href, pathname);
  const hasChildren = childrenLinks.length > 0;
  const isPath = href.startsWith("/") || href.startsWith("#");

  return (
    <div className={`nav-item ${hasChildren ? "has-children" : ""}`}>
      {isPath ? (
        <Link className="nav-link" href={href}>
          {item.label}
        </Link>
      ) : (
        <a
          className="nav-link"
          href={href}
          target={item.openInNewTab ? "_blank" : undefined}
          rel={item.openInNewTab ? "noreferrer" : undefined}
        >
          {item.label}
        </a>
      )}

      {hasChildren ? (
        <div className="nav-submenu">
          {childrenLinks.map((child) => {
            const childHref = resolveHref(child.href, pathname);
            const childIsPath = childHref.startsWith("/") || childHref.startsWith("#");
            return childIsPath ? (
              <Link key={child.id} className="nav-sub-link" href={childHref}>
                {child.label}
              </Link>
            ) : (
              <a
                key={child.id}
                className="nav-sub-link"
                href={childHref}
                target={child.openInNewTab ? "_blank" : undefined}
                rel={child.openInNewTab ? "noreferrer" : undefined}
              >
                {child.label}
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Header({ onOpenLogin, searchValue = "", onSearchChange, showSearch = true }: HeaderProps) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const bootstrap = useSiteBootstrap();

  const [menuLinks, setMenuLinks] = useState<NavigationLink[]>(
    bootstrap.headerLinks.length ? bootstrap.headerLinks : fallbackHeaderLinks
  );
  const [siteSettings, setSiteSettings] = useState(
    bootstrap.siteSettings.logoTitleLine1 ? bootstrap.siteSettings : fallbackSiteChromeSettings
  );
  const [themeMode, setThemeMode] = useState<"light" | "dark">(bootstrap.siteSettings.themeMode);
  const [internalSearch, setInternalSearch] = useState(searchValue);
  const [visitorCount, setVisitorCount] = useState(bootstrap.visitorCount);
  const [loginOpenInternal, setLoginOpenInternal] = useState(false);

  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (bootstrap.headerLinks.length) {
      setMenuLinks(bootstrap.headerLinks);
    }
    setSiteSettings(bootstrap.siteSettings);
    setVisitorCount(bootstrap.visitorCount);
  }, [bootstrap.headerLinks, bootstrap.siteSettings, bootstrap.visitorCount]);

  useEffect(() => {
    async function loadLinks() {
      try {
        const rows = await getNavigationLinks("header");
        if (rows.length) {
          setMenuLinks(rows);
        }
      } catch {
        // Keep server-hydrated links on failure.
      }
    }

    void loadLinks();
  }, []);

  useEffect(() => {
    async function loadVisitorCount() {
      try {
        const analytics = await getVisitorAnalytics();
        setVisitorCount(analytics.totalVisitors);
      } catch {
        // Keep current count on failure.
      }
    }

    const delayed = window.setTimeout(() => void loadVisitorCount(), 1500);
    const timer = window.setInterval(() => void loadVisitorCount(), 30000);
    return () => {
      window.clearTimeout(delayed);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const preferred = localStorage.getItem("ewm-theme") as "light" | "dark" | null;
    const nextMode = preferred || bootstrap.siteSettings.themeMode;
    setThemeMode(nextMode);
    document.documentElement.setAttribute("data-theme", nextMode);
    document.documentElement.style.setProperty("--container-pad", `${bootstrap.siteSettings.layoutSideGap}px`);
  }, [bootstrap.siteSettings.themeMode, bootstrap.siteSettings.layoutSideGap]);

  function toggleTheme() {
    const nextMode: "light" | "dark" = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    document.documentElement.setAttribute("data-theme", nextMode);
    localStorage.setItem("ewm-theme", nextMode);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = internalSearch.trim();

    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    if (!value) {
      router.push("/");
      return;
    }

    router.push(`/?search=${encodeURIComponent(value)}#topics`);
  }

  function handleLoginOpen() {
    if (onOpenLogin) {
      onOpenLogin();
      return;
    }
    setLoginOpenInternal(true);
  }

  const logoSizeStyle = useMemo(
    () => ({ width: `${siteSettings.logoSize}px`, height: `${siteSettings.logoSize}px` }),
    [siteSettings.logoSize]
  );

  const topLinks = useMemo(() => menuLinks.filter((item) => !item.parentId), [menuLinks]);
  const childrenMap = useMemo(() => {
    const map: Record<string, NavigationLink[]> = {};
    menuLinks.forEach((item) => {
      if (!item.parentId) {
        return;
      }
      if (!map[item.parentId]) {
        map[item.parentId] = [];
      }
      map[item.parentId].push(item);
    });
    return map;
  }, [menuLinks]);

  return (
    <>
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

        <div className="nav-center">
          <nav className="nav-links nav-menu">
            {topLinks.map((item) => (
              <MenuLink key={item.id} item={item} pathname={pathname} childrenLinks={childrenMap[item.id] ?? []} />
            ))}
          </nav>
          {showSearch ? (
            <form className="nav-search-wrap" onSubmit={handleSearchSubmit}>
              <input
                className="nav-search"
                type="search"
                placeholder="Search topics, posts, courses"
                value={internalSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setInternalSearch(value);
                  if (onSearchChange) {
                    onSearchChange(value);
                  }
                }}
              />
            </form>
          ) : null}
        </div>

        <div className="nav-links nav-actions">
          <span className="visitor-count visitor-count-highlight" title="Total visitors recorded">
            <span className="visitor-count-label">Total Visitors</span>
            <span className="visitor-count-number">{visitorCount.toLocaleString()}</span>
          </span>
          <button className="nav-btn secondary" onClick={toggleTheme} type="button">
            {themeMode === "dark" ? "Light" : "Dark"}
          </button>
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
            <button className="nav-btn" onClick={handleLoginOpen}>
              Login
            </button>
          )}
        </div>
      </header>
      <LoginModal open={loginOpenInternal} onClose={() => setLoginOpenInternal(false)} />
    </>
  );
}