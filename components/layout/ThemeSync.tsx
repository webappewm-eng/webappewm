"use client";

import { useEffect } from "react";
import { getSiteSettings } from "@/lib/firebase/data";

export function ThemeSync() {
  useEffect(() => {
    async function applyTheme() {
      try {
        const settings = await getSiteSettings();
        document.documentElement.setAttribute("data-theme", settings.themeMode);
      } catch {
        document.documentElement.setAttribute("data-theme", "light");
      }
    }

    void applyTheme();
  }, []);

  return null;
}
