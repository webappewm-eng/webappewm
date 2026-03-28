"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { heartbeatLivePresence } from "@/lib/firebase/data";

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

export function LiveTracker() {
  const { user } = useAuth();
  const sessionId = useMemo(() => getSessionId(), []);

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

  return null;
}
