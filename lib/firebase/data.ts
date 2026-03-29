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
  mockThirdPartyScripts
} from "@/lib/mock-data";
import {
  AnalyticsEvent,
  AnalyticsSummary,
  Category,
  CustomPage,
  Feedback,
  LivePresence,
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
  notifications: [] as NotificationMessage[],
  analyticsEvents: [] as AnalyticsEvent[],
  livePresence: [] as LivePresence[],
  siteSettings: { ...mockSiteSettings }
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

  const applyFilters = (rows: Post[]): Post[] => {
    let filtered = [...rows];
    if (filters?.categoryId) {
      filtered = filtered.filter((item) => item.categoryId === filters.categoryId);
    }
    if (filters?.subtopicId) {
      filtered = filtered.filter((item) => item.subtopicId === filters.subtopicId);
    }
    if (!includeDrafts) {
      filtered = filtered.filter((item) => item.isPublished);
    }
    return sortByDateDesc(filtered);
  };

  try {
    const snap = await getDocs(query(collection(db, "posts"), orderBy("publishedAt", "desc")));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Post, "id">) }));
    return applyFilters(rows);
  } catch {
    const snap = await getDocs(collection(db, "posts"));
    const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Post, "id">) }));
    return applyFilters(rows);
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!hasFirebaseConfig || !db) {
    return localStore.posts.find((item) => item.slug === slug) ?? null;
  }

  const snap = await getDocs(query(collection(db, "posts"), where("slug", "==", slug)));
  if (snap.empty) {
    return null;
  }

  const row = snap.docs[0];
  return { id: row.id, ...(row.data() as Omit<Post, "id">) };
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
    return { ...localStore.siteSettings };
  }

  const snap = await getDoc(doc(db, "site_settings", "global"));
  if (!snap.exists()) {
    return {
      id: "global",
      liveTrackingEnabled: true,
      updatedAt: new Date().toISOString()
    };
  }

  const data = snap.data() as Record<string, unknown>;
  return {
    id: "global",
    liveTrackingEnabled: data.liveTrackingEnabled !== false,
    updatedAt: normalizeDate(data.updatedAt)
  };
}

export async function updateLiveTracking(enabled: boolean): Promise<void> {
  if (!hasFirebaseConfig || !db) {
    localStore.siteSettings = {
      ...localStore.siteSettings,
      liveTrackingEnabled: enabled,
      updatedAt: new Date().toISOString()
    };
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


