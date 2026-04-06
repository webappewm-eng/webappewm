"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // In development, remove old service workers to avoid stale chunk/runtime issues.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {
          // silent fail
        });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // silent fail for unsupported or blocked environments
    });
  }, []);

  return null;
}
