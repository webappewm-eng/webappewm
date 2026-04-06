"use client";

import { useEffect } from "react";
import { useSiteBootstrap } from "@/components/layout/SiteBootstrapProvider";

export function ThemeSync() {
  const bootstrap = useSiteBootstrap();

  useEffect(() => {
    const preferred = localStorage.getItem("ewm-theme") as "light" | "dark" | null;
    const nextMode = preferred || bootstrap.siteSettings.themeMode;
    document.documentElement.setAttribute("data-theme", nextMode);
    document.documentElement.style.setProperty("--container-pad", `${bootstrap.siteSettings.layoutSideGap}px`);
  }, [bootstrap.siteSettings.themeMode, bootstrap.siteSettings.layoutSideGap]);

  return null;
}