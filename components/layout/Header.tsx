"use client";

import Link from "next/link";
import { logoutUser } from "@/lib/firebase/auth";
import { useAuth } from "@/components/auth/AuthProvider";

interface HeaderProps {
  onOpenLogin: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ onOpenLogin, searchValue = "", onSearchChange }: HeaderProps) {
  const { profile } = useAuth();

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
        <a className="nav-link" href="#categories">
          Categories
        </a>
        <a className="nav-link" href="#topics">
          Topics
        </a>
        <a className="nav-link" href="#subscribe">
          Subscribe
        </a>
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
