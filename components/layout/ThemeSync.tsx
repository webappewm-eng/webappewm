"use client";

import { useEffect } from "react";
import { getSiteSettings } from "@/lib/firebase/data";

export function ThemeSync() {
  useEffect(() => {
    async function applyTheme() {
      try {
        const settings = await getSiteSettings();
        document.documentElement.setAttribute("data-theme", settings.themeMode);
        document.documentElement.style.setProperty("--container-pad", `${settings.layoutSideGap}px`);
      } catch {
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.style.setProperty("--container-pad", "32px");
      }
    }

    void applyTheme();
  }, []);

  return null;
}


