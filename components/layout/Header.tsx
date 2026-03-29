"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutUser } from "@/lib/firebase/auth";
import { getNavigationLinks } from "@/lib/firebase/data";
import { useAuth } from "@/components/auth/AuthProvider";
import { NavigationLink } from "@/lib/types";

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

function LinkItem({ item }: { item: NavigationLink }) {
  const href = item.href;
  const isPath = href.startsWith("/");

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
  const [menuLinks, setMenuLinks] = useState<NavigationLink[]>(fallbackHeaderLinks);

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

  return (
    <header className="nav">
      <Link href="/" className="logo">
        <div className="logo-mark">
          <span className="logo-e">E</span>
        </div>
        <div className="logo-text">
          <span className="l1">Engineer</span>
          <span className="l2">
            With <span className="m">Me</span>
          </span>
        </div>
      </Link>

      <nav className="nav-links">
        {menuLinks.map((item) => (
          <LinkItem key={item.id} item={item} />
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
