import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "@/lib/firebase/client";
import {
  mockCategories,
  mockCustomPages,
  mockPosts,
  mockSiteSettings,
  mockSubtopics,
  mockThirdPartyScripts,
  mockNavigationLinks,
  mockHeroMedia
} from "@/lib/mock-data";
import {
  AnalyticsEvent,
  AnalyticsSummary,
  Category,
  CustomPage,
  Feedback,
  HeroMediaItem,
  LivePresence,
  NavigationLink,
  NotificationMessage,
  Post,
  SiteSettings,
  Subscription,
  Subtopic,
  ThirdPartyScript
} from "@/lib/types";

const localStore = {
  categories: [...mockCategories],
  subtopics: [...mockSubtopics],
  posts: [...mockPosts],
  feedback: [] as Feedback[],
  subscriptions: [] as Subscription[],
  customPages: [...mockCustomPages],
  scripts: [...mockThirdPartyScripts],
  navigationLinks: [...mockNavigationLinks],
  notifications: [] as NotificationMessage[],
  analyticsEvents: [] as AnalyticsEvent[],
  livePresence: [] as LivePresence[],
  siteSettings: { ...mockSiteSettings },
  heroMedia: [...mockHeroMedia]
};

function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function sortByDateDesc<T extends { publishedAt?: string; createdAt?: string; updatedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.publishedAt ?? a.createdAt ?? a.updatedAt ?? "";
    const right = b.publishedAt ?? b.createdAt ?? b.updatedAt ?? "";
    return right.localeCompare(left);
  });
}

function normalizeDate(rawDate: unknown): string {
  if (typeof rawDate === "string") {
    return rawDate;
  }

  if (rawDate && typeof rawDate === "object") {
    const value = rawDate as { toDate?: () => Date };
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
  }

  return new Date().toISOString();
}

function normalizeNavigationHref(rawHref: unknown): string {
  const value = String(rawHref ?? "").trim();
  if (!value) {
    return "/";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("#")) {
    return value;
  }

  return value.startsWith("/") ? value : `/${value}`;
}
function normalizeRedirectPath(rawPath: unknown): string {
  const value = String(rawPath ?? "").trim();
  if (!value) {
    return "/";
  }

  if (/^https?:\/\//i.test(value)) {
    return "/";
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeSiteSettings(raw: Partial<SiteSettings> | Record<string, unknown>): SiteSettings {
  const redirectType = raw.notFoundRedirectType === "custom" ? "custom" : "home";
  const redirectPath = normalizeRedirectPath(raw.notFoundRedirectPath);
  const buttonLabel = String(raw.notFoundButtonLabel ?? "").trim();
  const previewPercent = clampNumber(Number(raw.contentPreviewPercent ?? 20) || 20, 5, 95);
  const logoSize = clampNumber(Number(raw.logoSize ?? 38) || 38, 26, 80);
  const siteUrl = String(raw.siteUrl ?? "https://webappewm.vercel.app").trim();

  return {
    id: String(raw.id ?? "global"),
    liveTrackingEnabled: raw.liveTrackingEnabled !== false,
    themeMode: raw.themeMode === "dark" ? "dark" : "light",
    logoMode: raw.logoMode === "image" ? "image" : "text",
    logoImageUrl: String(raw.logoImageUrl ?? "").trim(),
    logoSize,
    logoTitleLine1: String(raw.logoTitleLine1 ?? "Engineer").trim() || "Engineer",
    logoTitleLine2: String(raw.logoTitleLine2 ?? "With").trim() || "With",
    logoAccentText: String(raw.logoAccentText ?? "Me").trim() || "Me",
    contentPreviewEnabled: raw.contentPreviewEnabled !== false,
    contentPreviewPercent: previewPercent,
    defaultSeoTitle: String(raw.defaultSeoTitle ?? "Engineer With Me").trim() || "Engineer With Me",
    defaultSeoDescription:
      String(raw.defaultSeoDescription ?? "Real Build. Real Code. Real Engineering.").trim() ||
      "Real Build. Real Code. Real Engineering.",
    defaultOgImage: String(raw.defaultOgImage ?? "").trim(),
    siteUrl: /^https?:\/\//i.test(siteUrl) ? siteUrl : "https://webappewm.vercel.app",
    robotsIndexable: raw.robotsIndexable !== false,
    geminiEnabled: Boolean(raw.geminiEnabled),
    geminiModel: String(raw.geminiModel ?? "gemini-1.5-flash").trim() || "gemini-1.5-flash",
    notFoundRedirectType: redirectType,
    notFoundRedirectPath: redirectType === "custom" ? redirectPath : "/",
    notFoundButtonLabel: buttonLabel || (redirectType === "custom" ? "Open Redirect Page" : "Go to Home"),
    updatedAt: normalizeDate(raw.updatedAt)
  };
}

export async function getCategories(): Promise<Category[]> {
  if (!hasFirebaseConfig || !db) {
    return sortByOrder(localStore.categories);
  }

  try {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
    return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Category, "id">) }));
  } catch {
    const snap = await getDocs(collection(db, "categories"));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Category, "id">) }));
    return sortByOrder(rows);
  }
}

export async function getSubtopics(categoryId?: string): Promise<Subtopic[]> {
  if (!hasFirebaseConfig || !db) {
    const rows = categoryId
      ? localStore.subtopics.filter((item) => item.categoryId === categoryId)
      : localStore.subtopics;
    return sortByOrder(rows);
  }

  try {
    const snap = await getDocs(query(collection(db, "subtopics"), orderBy("order", "asc")));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Subtopic, "id">) }));
    return categoryId ? rows.filter((item) => item.categoryId === categoryId) : rows;
  } catch {
    const snap = await getDocs(collection(db, "subtopics"));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Subtopic, "id">) }));
    const filtered = categoryId ? rows.filter((item) => item.categoryId === categoryId) : rows;
    return sortByOrder(filtered);
  }
}

export async function getPosts(filters?: {
  categoryId?: string;
  subtopicId?: string;
  includeDrafts?: boolean;
}): Promise<Post[]> {
  const includeDrafts = Boolean(filters?.includeDrafts);

  if (!hasFirebaseConfig || !db) {
    let rows = [...localStore.posts];
    if (filters?.categoryId) {
      rows = rows.filter((item) => item.categoryId === filters.categoryId);
    }
    if (filters?.subtopicId) {
      rows = rows.filter((item) => item.subtopicId === filters.subtopicId);
    }
    if (!includeDrafts) {
      rows = rows.filter((item) => item.isPublished);
    }
    return sortByDateDesc(rows);
  }

  const constraints: QueryConstraint[] = [];
  if (!includeDrafts) {
    constraints.push(where("isPublished", "==", true));
  }
  if (filters?.categoryId) {
    constraints.push(where("categoryId", "==", filters.categoryId));
  }
  if (filters?.subtopicId) {
    constraints.push(where("subtopicId", "==", filters.subtopicId));
  }

  const mapRows = (rows: Post[]): Post[] => sortByDateDesc(rows);

  try {
    const snap = await getDocs(query(collection(db, "posts"), ...constraints, orderBy("publishedAt", "desc")));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Post, "id">) }));
    return mapRows(rows);
  } catch {
    const snap = constraints.length
      ? await getDocs(query(collection(db, "posts"), ...constraints))
      : await getDocs(collection(db, "posts"));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Post, "id">) }));
    return mapRows(rows);
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!hasFirebaseConfig || !db) {
    const post = localStore.posts.find(
      (item) => item.isPublished && (item.slug === slug || item.slug.toLowerCase() === normalizedSlug || item.id === slug || item.slug.toLowerCase().startsWith(`${normalizedSlug}-`) || item.slug.toLowerCase().includes(normalizedSlug))
    );
    return post ?? null;
  }

  try {
    const exactSnap = await getDocs(
      query(collection(db, "posts"), where("slug", "==", slug), where("isPublished", "==", true))
    );
    if (!exactSnap.empty) {
      const row = exactSnap.docs[0];
      return { id: row.id, ...(row.data() as Omit<Post, "id">) };
    }

    const allPublished = await getPosts();
    return (
      allPublished.find(
        (item) =>
        item.slug.toLowerCase() === normalizedSlug ||
        item.id.toLowerCase() === normalizedSlug ||
        item.slug.toLowerCase().startsWith(`${normalizedSlug}-`) ||
        item.slug.toLowerCase().includes(normalizedSlug)
      ) ?? null
    );
  } catch {
    return null;
  }
}

export async function saveSubscription(email: string, topicId?: string): Promise<void> {
  const payload = {
    email: email.toLowerCase().trim(),
    topicId: topicId || "",
    createdAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.subscriptions.push({ id: `sub-${Date.now()}`, ...payload });
    return;
  }

  await addDoc(collection(db, "subscriptions"), {
    ...payload,
    createdAt: serverTimestamp()
  });
}

export async function listSubscriptions(): Promise<Subscription[]> {
  if (!hasFirebaseConfig || !db) {
    return sortByDateDesc(localStore.subscriptions);
  }

  const snap = await getDocs(query(collection(db, "subscriptions"), orderBy("createdAt", "desc")));
  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      email: String(data.email ?? ""),
      topicId: String(data.topicId ?? ""),
      createdAt: normalizeDate(data.createdAt)
    };
  });
}

export async function saveFeedback(payload: Omit<Feedback, "id" | "createdAt">): Promise<void> {
  const body = {
    ...payload,
    createdAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.feedback.unshift({ id: `fb-${Date.now()}`, ...body });
    localStore.analyticsEvents.unshift({
      id: `evt-${Date.now()}`,
      type: "feedback",
      postId: payload.postId,
      userId: payload.userId,
      createdAt: body.createdAt
    });
    return;
  }

  await addDoc(collection(db, "feedback"), {
    ...payload,
    createdAt: serverTimestamp()
  });
}

export async function getFeedback(postId?: string): Promise<Feedback[]> {
  if (!hasFirebaseConfig || !db) {
    const rows = postId ? localStore.feedback.filter((item) => item.postId === postId) : localStore.feedback;
    return sortByDateDesc(rows);
  }

  const base = collection(db, "feedback");
  const feedbackQuery = postId
    ? query(base, where("postId", "==", postId), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));

  const snap = await getDocs(feedbackQuery);
  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      postId: String(data.postId ?? ""),
      userId: String(data.userId ?? ""),
      userEmail: String(data.userEmail ?? ""),
      rating: Number(data.rating ?? 0),
      message: String(data.message ?? ""),
      createdAt: normalizeDate(data.createdAt)
    };
  });
}

export async function createCategory(input: Omit<Category, "id">): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.categories.push({ id: `cat-${Date.now()}`, ...input });
    return;
  }

  await addDoc(collection(db, "categories"), input);
}

export async function updateCategory(id: string, input: Partial<Omit<Category, "id">>): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.categories = localStore.categories.map((item) =>
      item.id === id ? { ...item, ...input } : item
    );
    return;
  }

  await updateDoc(doc(db, "categories", id), input);
}

export async function deleteCategory(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.categories = localStore.categories.filter((item) => item.id !== id);
    return;
  }

  await deleteDoc(doc(db, "categories", id));
}

export async function createSubtopic(input: Omit<Subtopic, "id">): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.subtopics.push({ id: `sub-${Date.now()}`, ...input });
    return;
  }

  await addDoc(collection(db, "subtopics"), input);
}

export async function updateSubtopic(id: string, input: Partial<Omit<Subtopic, "id">>): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.subtopics = localStore.subtopics.map((item) =>
      item.id === id ? { ...item, ...input } : item
    );
    return;
  }

  await updateDoc(doc(db, "subtopics", id), input);
}

export async function deleteSubtopic(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.subtopics = localStore.subtopics.filter((item) => item.id !== id);
    return;
  }

  await deleteDoc(doc(db, "subtopics", id));
}

export async function createPost(input: Omit<Post, "id">): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.posts.push({ id: `post-${Date.now()}`, ...input });
    return;
  }

  await addDoc(collection(db, "posts"), input);
}

export async function updatePost(id: string, input: Partial<Omit<Post, "id">>): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.posts = localStore.posts.map((item) =>
      item.id === id ? { ...item, ...input } : item
    );
    return;
  }

  await updateDoc(doc(db, "posts", id), input);
}

export async function deletePost(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.posts = localStore.posts.filter((item) => item.id !== id);
    localStore.feedback = localStore.feedback.filter((item) => item.postId !== id);
    return;
  }

  await deleteDoc(doc(db, "posts", id));
}

export async function getCustomPages(includeDrafts = false): Promise<CustomPage[]> {
  if (!hasFirebaseConfig || !db) {
    const rows = includeDrafts ? localStore.customPages : localStore.customPages.filter((item) => item.isPublished);
    return sortByDateDesc(rows);
  }

  const constraints: QueryConstraint[] = [];
  if (!includeDrafts) {
    constraints.push(where("isPublished", "==", true));
  }
  constraints.push(orderBy("updatedAt", "desc"));
  const snap = await getDocs(query(collection(db, "custom_pages"), ...constraints));

  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      title: String(data.title ?? ""),
      slug: String(data.slug ?? ""),
      content: String(data.content ?? ""),
      seoTitle: String(data.seoTitle ?? ""),
      seoDescription: String(data.seoDescription ?? ""),
      isPublished: Boolean(data.isPublished),
      updatedAt: normalizeDate(data.updatedAt)
    };
  });
}

export async function getCustomPageBySlug(slug: string): Promise<CustomPage | null> {
  if (!hasFirebaseConfig || !db) {
    return localStore.customPages.find((item) => item.slug === slug && item.isPublished) ?? null;
  }

  const snap = await getDocs(query(collection(db, "custom_pages"), where("slug", "==", slug), where("isPublished", "==", true)));
  if (snap.empty) {
    return null;
  }

  const item = snap.docs[0];
  const data = item.data() as Record<string, unknown>;
  return {
    id: item.id,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    content: String(data.content ?? ""),
    seoTitle: String(data.seoTitle ?? ""),
    seoDescription: String(data.seoDescription ?? ""),
    isPublished: Boolean(data.isPublished),
    updatedAt: normalizeDate(data.updatedAt)
  };
}

export async function createCustomPage(input: Omit<CustomPage, "id" | "updatedAt">): Promise<void> {
  const payload = {
    ...input,
    updatedAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.customPages.push({ id: `page-${Date.now()}`, ...payload });
    return;
  }

  await addDoc(collection(db, "custom_pages"), {
    ...input,
    updatedAt: serverTimestamp()
  });
}

export async function updateCustomPage(id: string, input: Partial<Omit<CustomPage, "id" | "updatedAt">>): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.customPages = localStore.customPages.map((item) =>
      item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item
    );
    return;
  }

  await updateDoc(doc(db, "custom_pages", id), {
    ...input,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCustomPage(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.customPages = localStore.customPages.filter((item) => item.id !== id);
    return;
  }

  await deleteDoc(doc(db, "custom_pages", id));
}

export async function getThirdPartyScripts(): Promise<ThirdPartyScript[]> {
  if (!hasFirebaseConfig || !db) {
    return sortByDateDesc(localStore.scripts);
  }

  const snap = await getDocs(query(collection(db, "third_party_scripts"), orderBy("updatedAt", "desc")));
  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      name: String(data.name ?? ""),
      src: String(data.src ?? ""),
      location: data.location === "head" ? "head" : "body",
      enabled: Boolean(data.enabled),
      updatedAt: normalizeDate(data.updatedAt)
    };
  });
}

export async function createThirdPartyScript(input: Omit<ThirdPartyScript, "id" | "updatedAt">): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.scripts.unshift({ id: `script-${Date.now()}`, ...input, updatedAt: new Date().toISOString() });
    return;
  }

  await addDoc(collection(db, "third_party_scripts"), {
    ...input,
    updatedAt: serverTimestamp()
  });
}

export async function updateThirdPartyScript(
  id: string,
  input: Partial<Omit<ThirdPartyScript, "id" | "updatedAt">>
): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.scripts = localStore.scripts.map((item) =>
      item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item
    );
    return;
  }

  await updateDoc(doc(db, "third_party_scripts", id), {
    ...input,
    updatedAt: serverTimestamp()
  });
}

export async function deleteThirdPartyScript(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.scripts = localStore.scripts.filter((item) => item.id !== id);
    return;
  }

  await deleteDoc(doc(db, "third_party_scripts", id));
}

export async function getNavigationLinks(location?: NavigationLink["location"]): Promise<NavigationLink[]> {
  const filterRows = (rows: NavigationLink[]) => {
    const enabledRows = rows.filter((item) => item.enabled);
    const filtered = location ? enabledRows.filter((item) => item.location === location) : enabledRows;
    return sortByOrder(filtered);
  };

  if (!hasFirebaseConfig || !db) {
    return filterRows(localStore.navigationLinks);
  }

  const mapDoc = (data: Record<string, unknown>, id: string): NavigationLink => ({
    id,
    label: String(data.label ?? ""),
    href: normalizeNavigationHref(data.href),
    location: data.location === "footer" ? "footer" : "header",
    order: Number(data.order ?? 0),
    enabled: data.enabled !== false,
    openInNewTab: Boolean(data.openInNewTab),
    updatedAt: normalizeDate(data.updatedAt)
  });

  try {
    const snap = await getDocs(query(collection(db, "navigation_links"), orderBy("order", "asc")));
    return filterRows(snap.docs.map((item) => mapDoc(item.data() as Record<string, unknown>, item.id)));
  } catch {
    const snap = await getDocs(collection(db, "navigation_links"));
    return filterRows(snap.docs.map((item) => mapDoc(item.data() as Record<string, unknown>, item.id)));
  }
}

export async function getNavigationLinksForAdmin(): Promise<NavigationLink[]> {
  if (!hasFirebaseConfig || !db) {
    return sortByOrder(localStore.navigationLinks);
  }

  try {
    const snap = await getDocs(query(collection(db, "navigation_links"), orderBy("order", "asc")));
    return snap.docs.map((item) => {
      const data = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        label: String(data.label ?? ""),
        href: normalizeNavigationHref(data.href),
        location: data.location === "footer" ? "footer" : "header",
        order: Number(data.order ?? 0),
        enabled: data.enabled !== false,
        openInNewTab: Boolean(data.openInNewTab),
        updatedAt: normalizeDate(data.updatedAt)
      };
    });
  } catch {
    const snap = await getDocs(collection(db, "navigation_links"));
    const rows = snap.docs.map((item) => {
      const data = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        label: String(data.label ?? ""),
        href: normalizeNavigationHref(data.href),
        location: data.location === "footer" ? "footer" : "header",
        order: Number(data.order ?? 0),
        enabled: data.enabled !== false,
        openInNewTab: Boolean(data.openInNewTab),
        updatedAt: normalizeDate(data.updatedAt)
      } as NavigationLink;
    });
    return sortByOrder(rows);
  }
}

export async function createNavigationLink(input: Omit<NavigationLink, "id" | "updatedAt">): Promise<void> {
  const payload = {
    ...input,
    href: normalizeNavigationHref(input.href),
    updatedAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.navigationLinks.push({ id: `nav-${Date.now()}`, ...payload });
    return;
  }

  await addDoc(collection(db, "navigation_links"), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateNavigationLink(
  id: string,
  input: Partial<Omit<NavigationLink, "id" | "updatedAt">>
): Promise<void> {
  const normalizedInput: Partial<Omit<NavigationLink, "id" | "updatedAt">> = {
    ...input,
    ...(typeof input.href === "string" ? { href: normalizeNavigationHref(input.href) } : {})
  };

  if (!hasFirebaseConfig || !db) {
    localStore.navigationLinks = localStore.navigationLinks.map((item) =>
      item.id === id
        ? {
            ...item,
            ...normalizedInput,
            updatedAt: new Date().toISOString()
          }
        : item
    );
    return;
  }

  await updateDoc(doc(db, "navigation_links", id), {
    ...normalizedInput,
    updatedAt: serverTimestamp()
  });
}

export async function deleteNavigationLink(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.navigationLinks = localStore.navigationLinks.filter((item) => item.id !== id);
    return;
  }

  await deleteDoc(doc(db, "navigation_links", id));
}

export async function getHeroMedia(section?: HeroMediaItem["section"]): Promise<HeroMediaItem[]> {
  const filterRows = (rows: HeroMediaItem[]) => {
    const enabled = rows.filter((item) => item.enabled);
    const filtered = section ? enabled.filter((item) => item.section === section) : enabled;
    return sortByOrder(filtered);
  };

  if (!hasFirebaseConfig || !db) {
    return filterRows(localStore.heroMedia);
  }

  try {
    const snap = await getDocs(query(collection(db, "hero_media"), orderBy("order", "asc")));
    const rows = snap.docs.map((item) => {
      const data = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        section: data.section === "video" ? "video" : "image",
        title: String(data.title ?? ""),
        source: String(data.source ?? ""),
        order: Number(data.order ?? 0),
        enabled: data.enabled !== false,
        updatedAt: normalizeDate(data.updatedAt)
      } as HeroMediaItem;
    });
    return filterRows(rows);
  } catch {
    return filterRows(localStore.heroMedia);
  }
}

export async function getHeroMediaForAdmin(): Promise<HeroMediaItem[]> {
  if (!hasFirebaseConfig || !db) {
    return sortByOrder(localStore.heroMedia);
  }

  try {
    const snap = await getDocs(query(collection(db, "hero_media"), orderBy("order", "asc")));
    return snap.docs.map((item) => {
      const data = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        section: data.section === "video" ? "video" : "image",
        title: String(data.title ?? ""),
        source: String(data.source ?? ""),
        order: Number(data.order ?? 0),
        enabled: data.enabled !== false,
        updatedAt: normalizeDate(data.updatedAt)
      } as HeroMediaItem;
    });
  } catch {
    return sortByOrder(localStore.heroMedia);
  }
}

export async function createHeroMedia(input: Omit<HeroMediaItem, "id" | "updatedAt">): Promise<void> {
  const payload = {
    ...input,
    updatedAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.heroMedia.push({ id: `hero-${Date.now()}`, ...payload });
    return;
  }

  await addDoc(collection(db, "hero_media"), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateHeroMedia(
  id: string,
  input: Partial<Omit<HeroMediaItem, "id" | "updatedAt">>
): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.heroMedia = localStore.heroMedia.map((item) =>
      item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item
    );
    return;
  }

  await updateDoc(doc(db, "hero_media", id), {
    ...input,
    updatedAt: serverTimestamp()
  });
}

export async function deleteHeroMedia(id: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.heroMedia = localStore.heroMedia.filter((item) => item.id !== id);
    return;
  }

  await deleteDoc(doc(db, "hero_media", id));
}
export async function createNotification(input: Omit<NotificationMessage, "id" | "createdAt">): Promise<void> {
  const payload = {
    ...input,
    createdAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.notifications.unshift({ id: `notify-${Date.now()}`, ...payload });
    return;
  }

  await addDoc(collection(db, "notifications"), {
    ...input,
    createdAt: serverTimestamp()
  });
}

export async function getNotifications(): Promise<NotificationMessage[]> {
  if (!hasFirebaseConfig || !db) {
    return sortByDateDesc(localStore.notifications);
  }

  const snap = await getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc")));
  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      title: String(data.title ?? ""),
      message: String(data.message ?? ""),
      target: data.target === "topic" ? "topic" : "website",
      topicId: String(data.topicId ?? ""),
      createdAt: normalizeDate(data.createdAt)
    };
  });
}

export async function trackAnalyticsEvent(input: Omit<AnalyticsEvent, "id" | "createdAt">): Promise<void> {
  const payload = {
    ...input,
    createdAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    localStore.analyticsEvents.unshift({ id: `evt-${Date.now()}`, ...payload });
    return;
  }

  await addDoc(collection(db, "analytics_events"), {
    ...input,
    createdAt: serverTimestamp()
  });
}

export async function heartbeatLivePresence(input: { userId: string; email?: string; sessionId: string }): Promise<void> {
  const payload = {
    userId: input.userId,
    email: input.email ?? "",
    sessionId: input.sessionId,
    lastSeenAt: new Date().toISOString()
  };

  if (!hasFirebaseConfig || !db) {
    const existingIndex = localStore.livePresence.findIndex((item) => item.sessionId === input.sessionId);
    if (existingIndex >= 0) {
      localStore.livePresence[existingIndex] = {
        ...localStore.livePresence[existingIndex],
        ...payload
      };
    } else {
      localStore.livePresence.push({ id: `presence-${Date.now()}`, ...payload });
    }
    return;
  }

  await setDoc(
    doc(db, "live_presence", input.sessionId),
    {
      ...payload,
      lastSeenAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasFirebaseConfig || !db) {
    return normalizeSiteSettings(localStore.siteSettings);
  }

  const snap = await getDoc(doc(db, "site_settings", "global"));
  if (!snap.exists()) {
    return normalizeSiteSettings({ id: "global" });
  }

  const data = snap.data() as Record<string, unknown>;
  return normalizeSiteSettings({
    ...data,
    id: "global"
  });
}

export async function updateLiveTracking(enabled: boolean): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.siteSettings = normalizeSiteSettings({
      ...localStore.siteSettings,
      liveTrackingEnabled: enabled,
      updatedAt: new Date().toISOString()
    });
    return;
  }

  await setDoc(
    doc(db, "site_settings", "global"),
    {
      liveTrackingEnabled: enabled,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function updateNotFoundSettings(input: {
  notFoundRedirectType: SiteSettings["notFoundRedirectType"];
  notFoundRedirectPath: string;
  notFoundButtonLabel: string;
}): Promise<void> {
  const nextRedirectType = input.notFoundRedirectType === "custom" ? "custom" : "home";
  const nextRedirectPath = normalizeRedirectPath(input.notFoundRedirectPath);
  const nextButtonLabel = input.notFoundButtonLabel.trim();

  if (!hasFirebaseConfig || !db) {
    localStore.siteSettings = normalizeSiteSettings({
      ...localStore.siteSettings,
      notFoundRedirectType: nextRedirectType,
      notFoundRedirectPath: nextRedirectType === "custom" ? nextRedirectPath : "/",
      notFoundButtonLabel: nextButtonLabel || (nextRedirectType === "custom" ? "Open Redirect Page" : "Go to Home"),
      updatedAt: new Date().toISOString()
    });
    return;
  }

  await setDoc(
    doc(db, "site_settings", "global"),
    {
      notFoundRedirectType: nextRedirectType,
      notFoundRedirectPath: nextRedirectType === "custom" ? nextRedirectPath : "/",
      notFoundButtonLabel: nextButtonLabel || (nextRedirectType === "custom" ? "Open Redirect Page" : "Go to Home"),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function updateSiteAppearanceSettings(input: {
  themeMode: SiteSettings["themeMode"];
  logoMode: SiteSettings["logoMode"];
  logoImageUrl: string;
  logoSize: number;
  logoTitleLine1: string;
  logoTitleLine2: string;
  logoAccentText: string;
  contentPreviewEnabled: boolean;
  contentPreviewPercent: number;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage: string;
  siteUrl: string;
  robotsIndexable: boolean;
  geminiEnabled: boolean;
  geminiModel: string;
}): Promise<void> {
  const normalized = normalizeSiteSettings({ ...localStore.siteSettings, ...input });

  if (!hasFirebaseConfig || !db) {
    localStore.siteSettings = {
      ...localStore.siteSettings,
      ...normalized,
      updatedAt: new Date().toISOString()
    };
    return;
  }

  await setDoc(
    doc(db, "site_settings", "global"),
    {
      themeMode: normalized.themeMode,
      logoMode: normalized.logoMode,
      logoImageUrl: normalized.logoImageUrl,
      logoSize: normalized.logoSize,
      logoTitleLine1: normalized.logoTitleLine1,
      logoTitleLine2: normalized.logoTitleLine2,
      logoAccentText: normalized.logoAccentText,
      contentPreviewEnabled: normalized.contentPreviewEnabled,
      contentPreviewPercent: normalized.contentPreviewPercent,
      defaultSeoTitle: normalized.defaultSeoTitle,
      defaultSeoDescription: normalized.defaultSeoDescription,
      defaultOgImage: normalized.defaultOgImage,
      siteUrl: normalized.siteUrl,
      robotsIndexable: normalized.robotsIndexable,
      geminiEnabled: normalized.geminiEnabled,
      geminiModel: normalized.geminiModel,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  if (!hasFirebaseConfig || !db) {
    const activeWindowMs = 5 * 60 * 1000;
    const now = Date.now();
    const activeUsers = localStore.siteSettings.liveTrackingEnabled
      ? localStore.livePresence.filter((item) => now - new Date(item.lastSeenAt).getTime() < activeWindowMs).length
      : 0;

    return {
      activeUsers,
      views: localStore.analyticsEvents.filter((item) => item.type === "post_view").length,
      downloads: localStore.analyticsEvents.filter((item) => item.type === "pdf_download").length,
      feedbackCount: localStore.feedback.length
    };
  }

  const [eventsSnap, feedbackSnap, presenceSnap, settings] = await Promise.all([
    getDocs(query(collection(db, "analytics_events"))),
    getDocs(query(collection(db, "feedback"))),
    getDocs(query(collection(db, "live_presence"))),
    getSiteSettings()
  ]);

  const now = Date.now();
  const activeWindowMs = 5 * 60 * 1000;
  const activeUsers = settings.liveTrackingEnabled
    ? presenceSnap.docs.filter((item) => {
        const data = item.data() as Record<string, unknown>;
        const lastSeenAt = normalizeDate(data.lastSeenAt);
        return now - new Date(lastSeenAt).getTime() < activeWindowMs;
      }).length
    : 0;

  let views = 0;
  let downloads = 0;

  eventsSnap.docs.forEach((item) => {
    const data = item.data() as Record<string, unknown>;
    const type = String(data.type ?? "");
    if (type === "post_view") {
      views += 1;
    }
    if (type === "pdf_download") {
      downloads += 1;
    }
  });

  return {
    activeUsers,
    views,
    downloads,
    feedbackCount: feedbackSnap.size
  };
}

export async function upsertAdminProfile(uid: string, email: string): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    return;
  }

  await setDoc(
    doc(db, "users", uid),
    {
      email,
      role: "admin",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}








