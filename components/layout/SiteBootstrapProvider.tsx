"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SiteBootstrapSnapshot, fallbackSiteBootstrapSnapshot } from "@/lib/site/bootstrap";

const SiteBootstrapContext = createContext<SiteBootstrapSnapshot>(fallbackSiteBootstrapSnapshot);

export function SiteBootstrapProvider({
  snapshot,
  children
}: {
  snapshot: SiteBootstrapSnapshot;
  children: ReactNode;
}) {
  return <SiteBootstrapContext.Provider value={snapshot}>{children}</SiteBootstrapContext.Provider>;
}

export function useSiteBootstrap(): SiteBootstrapSnapshot {
  return useContext(SiteBootstrapContext);
}
