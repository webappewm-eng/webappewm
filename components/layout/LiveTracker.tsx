"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { heartbeatLivePresence, trackVisitorEvent } from "@/lib/firebase/data";

function getSessionId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const key = "ewm_session_id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

function getVisitorId(): string {
  if (typeof window === "undefined") {
    return "server-visitor";
  }

  const key = "ewm_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const next = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, next);
  return next;
}

async function fetchCountry(): Promise<string> {
  try {
    const response = await fetch("/api/visitor-country", { cache: "no-store" });
    if (!response.ok) {
      return "Unknown";
    }
    const data = (await response.json()) as { country?: string };
    return (data.country || "Unknown").trim() || "Unknown";
  } catch {
    return "Unknown";
  }
}

export function LiveTracker() {
  const { user } = useAuth();
  const pathname = usePathname();
  const sessionId = useMemo(() => getSessionId(), []);
  const visitorId = useMemo(() => getVisitorId(), []);

  useEffect(() => {
    const track = () => {
      void heartbeatLivePresence({
        userId: user?.uid ?? "anonymous",
        email: user?.email ?? "",
        sessionId
      });
    };

    track();
    const timer = window.setInterval(track, 60000);
    return () => window.clearInterval(timer);
  }, [sessionId, user?.email, user?.uid]);

  useEffect(() => {
    let active = true;

    async function trackVisitor() {
      const country = await fetchCountry();
      if (!active) {
        return;
      }

      await trackVisitorEvent({
        visitorId,
        country,
        pagePath: pathname || "/"
      });
    }

    void trackVisitor();

    return () => {
      active = false;
    };
  }, [pathname, visitorId]);

  return null;
}
