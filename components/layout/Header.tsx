'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";
import { useSiteBootstrap } from "@/components/layout/SiteBootstrapProvider";
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

function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.9 3.4c-1.2.3-2.4.9-3.5 1.8-2.2 1.8-3.4 4.5-3.4 7.4 0 5.1 4.1 9.2 9.2 9.2 1.1 0 2.2-.2 3.2-.6-1.5 1.4-3.5 2.2-5.6 2.2-4.7 0-8.5-3.8-8.5-8.5 0-2.8 1.4-5.4 3.7-7 .5-.4 1.1-.7 1.8-1 .9-.4 1.9-.6 3-.7Z"
        fill="currentColor"
        opacity={dark ? 1 : 0.9}
      />
      {dark ? <circle cx="17.6" cy="6.2" r="1.1" fill="currentColor" opacity="0.85" /> : null}
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="currentColor" />
      <path d="M5.5 19.2c.9-3 3.4-4.7 6.5-4.7s5.6 1.7 6.5 4.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
  }, [bootstrap.siteSettings.themeMode]);

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
      <header className="nav nav-responsive">
        <div className="nav-bar-row">
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

          <div className="nav-center nav-center-desktop">
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

          <div className="nav-links nav-actions nav-actions-desktop">
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
              <Link href="/profile" className="nav-btn secondary nav-btn-icon" aria-label="Profile" title="Profile">
                <ProfileIcon />
              </Link>
            ) : (
              <button className="nav-btn" onClick={handleLoginOpen} type="button">
                Login
              </button>
            )}
          </div>

          <div className="nav-mobile-tools">
            <button
              className="nav-btn secondary nav-btn-mobile-icon"
              onClick={toggleTheme}
              type="button"
              aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={themeMode === "dark" ? "Light mode" : "Dark mode"}
            >
              <ThemeIcon dark={themeMode === "dark"} />
            </button>
            <span className="visitor-count visitor-count-highlight visitor-count-mobile" title="Total visitors recorded">
              <span className="visitor-count-label">Visitors</span>
              <span className="visitor-count-number">{visitorCount.toLocaleString()}</span>
            </span>
            {profile?.isAdmin ? (
              <Link href="/admin" className="nav-btn secondary nav-btn-mobile-inline">
                Admin
              </Link>
            ) : null}
            {profile ? (
              <Link href="/profile" className="nav-btn secondary nav-btn-icon nav-btn-mobile-icon" aria-label="Profile" title="Profile">
                <ProfileIcon />
              </Link>
            ) : (
              <button className="nav-btn nav-btn-mobile-inline" onClick={handleLoginOpen} type="button">
                Login
              </button>
            )}
            <button
              className="nav-btn secondary nav-mobile-toggle"
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="nav-mobile-panel">
          <nav className="nav-mobile-links" aria-label="Mobile navigation">
            {topLinks.map((item) => {
              const href = resolveHref(item.href, pathname);
              const isPath = href.startsWith("/") || href.startsWith("#");
              return (
                <div className="nav-mobile-link-group" key={`mobile-${item.id}`}>
                  {isPath ? (
                    <Link className="nav-mobile-link" href={href}>
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      className="nav-mobile-link"
                      href={href}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={item.openInNewTab ? "noreferrer" : undefined}
                    >
                      {item.label}
                    </a>
                  )}
                  {(childrenMap[item.id] ?? []).map((child) => {
                    const childHref = resolveHref(child.href, pathname);
                    const childIsPath = childHref.startsWith("/") || childHref.startsWith("#");
                    return childIsPath ? (
                      <Link key={`mobile-child-${child.id}`} className="nav-mobile-sub-link" href={childHref}>
                        {child.label}
                      </Link>
                    ) : (
                      <a
                        key={`mobile-child-${child.id}`}
                        className="nav-mobile-sub-link"
                        href={childHref}
                        target={child.openInNewTab ? "_blank" : undefined}
                        rel={child.openInNewTab ? "noreferrer" : undefined}
                      >
                        {child.label}
                      </a>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          {showSearch ? (
            <div className="nav-mobile-panel-search">
              <form className="nav-search-wrap nav-search-wrap-mobile" onSubmit={handleSearchSubmit}>
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
            </div>
          ) : null}
        </div>
      ) : null}

      <LoginModal open={loginOpenInternal} onClose={() => setLoginOpenInternal(false)} />
    </>
  );
}
