import {
  Category,
  CustomPage,
  HeroMediaItem,
  NavigationLink,
  Post,
  SiteSettings,
  Subtopic,
  ThirdPartyScript
} from "@/lib/types";

export const mockCategories: Category[] = [
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    description: "Components, circuits, and practical electronic builds.",
    order: 1
  },
  {
    id: "cat-mechanical",
    name: "Mechanical",
    slug: "mechanical",
    description: "Mechanisms, torque, motion, and machine fundamentals.",
    order: 2
  },
  {
    id: "cat-software",
    name: "Software",
    slug: "software",
    description: "Programming for embedded and engineering projects.",
    order: 3
  }
];

export const mockSubtopics: Subtopic[] = [
  { id: "sub-ohm", categoryId: "cat-electronics", name: "Ohm's Law", slug: "ohms-law", order: 1 },
  { id: "sub-led", categoryId: "cat-electronics", name: "LED Circuits", slug: "led-circuits", order: 2 },
  { id: "sub-capacitor", categoryId: "cat-electronics", name: "Capacitors", slug: "capacitors", order: 3 },
  { id: "sub-gears", categoryId: "cat-mechanical", name: "Gear Basics", slug: "gear-basics", order: 1 },
  { id: "sub-arduino", categoryId: "cat-software", name: "Arduino Basics", slug: "arduino-basics", order: 1 }
];

const resistorContent = [
  "A resistor is a fundamental component that controls the flow of electric current. In practical circuits, it protects sensitive parts by limiting current to safe values.",
  "Whenever you add an LED to a battery, the resistor is the safety guard. Without it, current rises too quickly and can permanently damage the LED.",
  "The core formula is Ohm's Law: I = V / R. If voltage increases and resistance stays constant, current increases. If resistance increases at fixed voltage, current decreases.",
  "In real projects, we choose resistor value based on supply voltage, component limits, and desired behavior. For example, in an LED circuit we calculate the resistor from the voltage drop and target current.",
  "Temperature, tolerance, and power rating also matter. A 220 Ohm resistor with 5% tolerance might behave closer to 209 Ohm or 231 Ohm in reality.",
  "Resistor power is calculated by P = I^2 * R or P = V * I. Pick a resistor with headroom so it does not overheat in continuous operation.",
  "Common values come from E-series charts (E6, E12, E24). These standard ranges make manufacturing practical while covering useful resistance intervals.",
  "In troubleshooting, measuring voltage across and current through resistors helps isolate short circuits, open lines, and wrong component placements.",
  "In digital electronics, pull-up and pull-down resistors define stable logic states. They prevent floating inputs and random switching behavior.",
  "In analog circuits, resistor networks shape gain, filtering, and biasing. Their placement directly impacts noise and signal stability.",
  "When working with sensors, resistive dividers are often used to scale voltages into safe ADC ranges for microcontrollers.",
  "For beginners, mastering resistors creates intuition for nearly every future electronics topic."
].join("\n\n");

export const mockPosts: Post[] = [
  {
    id: "post-resistor-guide",
    categoryId: "cat-electronics",
    subtopicId: "sub-ohm",
    title: "Resistor Basics: Current Control in Real Circuits",
    slug: "resistor-basics-current-control",
    excerpt: "Learn how resistors protect circuits, control current, and power stable electronics designs.",
    content: `${resistorContent}\n\n\`\`\`cpp
float calcResistor(float vSupply, float vLed, float iLed) {
  return (vSupply - vLed) / iLed;
}
\`\`\`\n\nUse this function to estimate LED series resistor values before hardware testing.`,
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    tags: ["electronics", "resistor", "ohms-law"],
    seoTitle: "Resistor Basics - Engineer With Me",
    seoDescription: "Understand resistors in practical electronics with formulas and examples.",
    isPublished: true,
    publishedAt: "2026-03-28"
  },
  {
    id: "post-led",
    categoryId: "cat-electronics",
    subtopicId: "sub-led",
    title: "LED Circuit Essentials",
    slug: "led-circuit-essentials",
    excerpt: "Choose the right resistor and supply for stable LED operation.",
    content: "LEDs are current-driven devices and always need a limiter in standard circuits. Combine practical resistor sizing with safe power checks for reliable performance.",
    coverImage: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&w=1200&q=80",
    tags: ["electronics", "led"],
    isPublished: true,
    publishedAt: "2026-03-20"
  }
];

export const mockCustomPages: CustomPage[] = [
  {
    id: "page-terms",
    title: "Terms and Conditions",
    slug: "terms-and-conditions",
    content: "These are sample terms. Replace with your official policy.",
    seoTitle: "Terms and Conditions",
    seoDescription: "Terms for using Engineer With Me.",
    isPublished: true,
    updatedAt: "2026-03-28"
  },
  {
    id: "page-privacy",
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: "This is sample privacy content. Replace with your policy text.",
    seoTitle: "Privacy Policy",
    seoDescription: "Privacy policy for Engineer With Me.",
    isPublished: true,
    updatedAt: "2026-03-28"
  }
];

export const mockHeroMedia: HeroMediaItem[] = [
  {
    id: "hero-video-1",
    section: "video",
    title: "Real circuit walkthrough",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    order: 1,
    enabled: true,
    updatedAt: "2026-03-28"
  },
  {
    id: "hero-video-2",
    section: "video",
    title: "Hands-on component demo",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    order: 2,
    enabled: true,
    updatedAt: "2026-03-28"
  },
  {
    id: "hero-image-1",
    section: "image",
    title: "Build from fundamentals",
    source: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80",
    order: 1,
    enabled: true,
    updatedAt: "2026-03-28"
  },
  {
    id: "hero-image-2",
    section: "image",
    title: "Practical electronics learning",
    source: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    order: 2,
    enabled: true,
    updatedAt: "2026-03-28"
  },
  {
    id: "hero-image-3",
    section: "image",
    title: "From theory to projects",
    source: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    order: 3,
    enabled: true,
    updatedAt: "2026-03-28"
  }
];

export const mockThirdPartyScripts: ThirdPartyScript[] = [];

export const mockNavigationLinks: NavigationLink[] = [
  {
    id: "nav-header-categories",
    label: "Categories",
    href: "#categories",
    location: "header",
    order: 1,
    enabled: true,
    openInNewTab: false,
    updatedAt: "2026-03-28"
  },
  {
    id: "nav-header-topics",
    label: "Topics",
    href: "#topics",
    location: "header",
    order: 2,
    enabled: true,
    openInNewTab: false,
    updatedAt: "2026-03-28"
  },
  {
    id: "nav-header-subscribe",
    label: "Subscribe",
    href: "#subscribe",
    location: "header",
    order: 3,
    enabled: true,
    openInNewTab: false,
    updatedAt: "2026-03-28"
  },
  {
    id: "nav-footer-terms",
    label: "Terms and Conditions",
    href: "/pages/terms-and-conditions",
    location: "footer",
    order: 1,
    enabled: true,
    openInNewTab: false,
    updatedAt: "2026-03-28"
  },
  {
    id: "nav-footer-privacy",
    label: "Privacy Policy",
    href: "/pages/privacy-policy",
    location: "footer",
    order: 2,
    enabled: true,
    openInNewTab: false,
    updatedAt: "2026-03-28"
  },
  {
    id: "nav-footer-about",
    label: "About",
    href: "/pages/about",
    location: "footer",
    order: 3,
    enabled: true,
    openInNewTab: false,
    updatedAt: "2026-03-28"
  }
];

export const mockSiteSettings: SiteSettings = {
  id: "global",
  liveTrackingEnabled: true,
  themeMode: "light",
  logoMode: "text",
  logoImageUrl: "",
  logoSize: 38,
  logoTitleLine1: "Engineer",
  logoTitleLine2: "With",
  logoAccentText: "Me",
  contentPreviewEnabled: true,
  contentPreviewPercent: 20,
  defaultSeoTitle: "Engineer With Me",
  defaultSeoDescription: "Real Build. Real Code. Real Engineering.",
  defaultOgImage: "",
  siteUrl: "https://webappewm.vercel.app",
  robotsIndexable: true,
  geminiEnabled: false,
  geminiModel: "gemini-1.5-flash",
  notFoundRedirectType: "home",
  notFoundRedirectPath: "/",
  notFoundButtonLabel: "Go to Home",
  updatedAt: "2026-03-28"
};

