import { NavigationLink, SiteSettings, SocialLink } from "@/lib/types";

export type SiteChromeSettings = Pick<
  SiteSettings,
  "themeMode" | "layoutSideGap" | "logoMode" | "logoImageUrl" | "logoSize" | "logoTitleLine1" | "logoTitleLine2" | "logoAccentText"
>;

export interface SiteBootstrapSnapshot {
  siteSettings: SiteChromeSettings;
  headerLinks: NavigationLink[];
  footerLinks: NavigationLink[];
  footerSocialLinks: SocialLink[];
  floatingSocialLinks: SocialLink[];
  visitorCount: number;
}

export const fallbackHeaderLinks: NavigationLink[] = [
  {
    id: "fallback-header-categories",
    label: "Home",
    href: "/",
    location: "header",
    order: 1,
    parentId: "",
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-header-topics",
    label: "Courses",
    href: "/courses",
    location: "header",
    order: 2,
    parentId: "",
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-header-community",
    label: "Community",
    href: "/community",
    location: "header",
    order: 3,
    parentId: "",
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-header-subscribe",
    label: "Subscribe",
    href: "#subscribe",
    location: "header",
    order: 4,
    parentId: "",
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  }
];

export const fallbackFooterLinks: NavigationLink[] = [
  {
    id: "fallback-footer-terms",
    label: "Terms and Conditions",
    href: "/pages/terms-and-conditions",
    location: "footer",
    order: 1,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-footer-privacy",
    label: "Privacy Policy",
    href: "/pages/privacy-policy",
    location: "footer",
    order: 2,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  },
  {
    id: "fallback-footer-about",
    label: "About",
    href: "/pages/about",
    location: "footer",
    order: 3,
    enabled: true,
    openInNewTab: false,
    updatedAt: ""
  }
];

export const fallbackSiteChromeSettings: SiteChromeSettings = {
  themeMode: "light",
  layoutSideGap: 32,
  logoMode: "text",
  logoImageUrl: "",
  logoSize: 38,
  logoTitleLine1: "Engineer",
  logoTitleLine2: "With",
  logoAccentText: "Me"
};

export const fallbackSiteBootstrapSnapshot: SiteBootstrapSnapshot = {
  siteSettings: fallbackSiteChromeSettings,
  headerLinks: fallbackHeaderLinks,
  footerLinks: fallbackFooterLinks,
  footerSocialLinks: [],
  floatingSocialLinks: [],
  visitorCount: 0
};