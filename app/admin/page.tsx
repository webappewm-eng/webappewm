"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { uploadPostImage, uploadSiteAsset } from "@/lib/firebase/storage";
import { Header } from "@/components/layout/Header";
import { RichPostEditor } from "@/components/editor/RichPostEditor";
import {
  createCategory,
  createCustomPage,
  createHeroMedia,
  createNotification,
  createNavigationLink,
  createPost,
  createSubtopic,
  createThirdPartyScript,
  deleteCategory,
  deleteCustomPage,
  deleteHeroMedia,
  deleteNavigationLink,
  deletePost,
  deleteSubtopic,
  deleteThirdPartyScript,
  getAnalyticsSummary,
  getCategories,
  getCustomPages,
  getFeedback,
  getHeroMediaForAdmin,
  getNotifications,
  getNavigationLinksForAdmin,
  getPosts,
  getSiteSettings,
  getSubtopics,
  getThirdPartyScripts,
  listSubscriptions,
  updateCategory,
  updateCustomPage,
  updateHeroMedia,
  updateLiveTracking,
  updateNavigationLink,
  updateNotFoundSettings,
  updatePost,
  updateSiteAppearanceSettings,
  updateSubtopic,
  updateThirdPartyScript
} from "@/lib/firebase/data";
import {
  AnalyticsSummary,
  Category,
  CustomPage,
  Feedback,
  HeroMediaItem,
  NavigationLink,
  NotificationMessage,
  Post,
  SiteSettings,
  Subscription,
  Subtopic,
  ThirdPartyScript
} from "@/lib/types";

const emptyPostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  categoryId: "",
  subtopicId: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  isPublished: true,
  publishedAt: new Date().toISOString().slice(0, 10)
};

const emptyPageForm = {
  title: "",
  slug: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  isPublished: true
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
export default function AdminPage() {
  const { profile, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [scripts, setScripts] = useState<ThirdPartyScript[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    activeUsers: 0,
    views: 0,
    downloads: 0,
    feedbackCount: 0
  });
  const [settings, setSettings] = useState<SiteSettings>({
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
    updatedAt: new Date().toISOString()
  });

  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [categoryEditingId, setCategoryEditingId] = useState("");

  const [subtopicForm, setSubtopicForm] = useState({ categoryId: "", name: "", slug: "" });
  const [subtopicEditingId, setSubtopicEditingId] = useState("");

  const [postForm, setPostForm] = useState(emptyPostForm);
  const [postEditingId, setPostEditingId] = useState("");

  const [pageForm, setPageForm] = useState(emptyPageForm);
  const [pageEditingId, setPageEditingId] = useState("");

  const [scriptForm, setScriptForm] = useState({ name: "", src: "", location: "body" as "head" | "body" });
  const [heroMedia, setHeroMedia] = useState<HeroMediaItem[]>([]);
  const [heroForm, setHeroForm] = useState({
    section: "video" as HeroMediaItem["section"],
    title: "",
    source: "",
    order: "1",
    enabled: true
  });
  const [heroEditingId, setHeroEditingId] = useState("");

  const [appearanceForm, setAppearanceForm] = useState({
    themeMode: "light" as SiteSettings["themeMode"],
    logoMode: "text" as SiteSettings["logoMode"],
    logoImageUrl: "",
    logoSize: "38",
    logoTitleLine1: "Engineer",
    logoTitleLine2: "With",
    logoAccentText: "Me",
    contentPreviewEnabled: true,
    contentPreviewPercent: "20",
    defaultSeoTitle: "Engineer With Me",
    defaultSeoDescription: "Real Build. Real Code. Real Engineering.",
    defaultOgImage: "",
    siteUrl: "https://webappewm.vercel.app",
    robotsIndexable: true,
    geminiEnabled: false,
    geminiModel: "gemini-1.5-flash"
  });

  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", target: "website" as "website" | "topic", topicId: "" });

  const [navForm, setNavForm] = useState({
    label: "",
    href: "",
    location: "header" as NavigationLink["location"],
    order: "1",
    enabled: true,
    openInNewTab: false
  });
  const [navEditingId, setNavEditingId] = useState("");

  const [notFoundForm, setNotFoundForm] = useState({
    notFoundRedirectType: "home" as SiteSettings["notFoundRedirectType"],
    notFoundRedirectPath: "/",
    notFoundButtonLabel: "Go to Home"
  });


  const [status, setStatus] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const refreshAll = useCallback(async () => {
    const [
      nextCategories,
      nextSubtopics,
      nextPosts,
      nextFeedback,
      nextPages,
      nextScripts,
      nextHeroMedia,
      nextSubscriptions,
      nextNotifications,
      nextNavLinks,
      nextAnalytics,
      nextSettings
    ] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts({ includeDrafts: true }),
      getFeedback(),
      getCustomPages(true),
      getThirdPartyScripts(),
      getHeroMediaForAdmin(),
      listSubscriptions(),
      getNotifications(),
      getNavigationLinksForAdmin(),
      getAnalyticsSummary(),
      getSiteSettings()
    ]);

    setCategories(nextCategories);
    setSubtopics(nextSubtopics);
    setPosts(nextPosts);
    setFeedback(nextFeedback);
    setPages(nextPages);
    setScripts(nextScripts);
    setHeroMedia(nextHeroMedia);
    setSubscriptions(nextSubscriptions);
    setNotifications(nextNotifications);
    setNavigationLinks(nextNavLinks);
    setAnalytics(nextAnalytics);
    setSettings(nextSettings);
    setNotFoundForm({
      notFoundRedirectType: nextSettings.notFoundRedirectType,
      notFoundRedirectPath: nextSettings.notFoundRedirectPath,
      notFoundButtonLabel: nextSettings.notFoundButtonLabel
    });

    setAppearanceForm({
      themeMode: nextSettings.themeMode,
      logoMode: nextSettings.logoMode,
      logoImageUrl: nextSettings.logoImageUrl,
      logoSize: String(nextSettings.logoSize),
      logoTitleLine1: nextSettings.logoTitleLine1,
      logoTitleLine2: nextSettings.logoTitleLine2,
      logoAccentText: nextSettings.logoAccentText,
      contentPreviewEnabled: nextSettings.contentPreviewEnabled,
      contentPreviewPercent: String(nextSettings.contentPreviewPercent),
      defaultSeoTitle: nextSettings.defaultSeoTitle,
      defaultSeoDescription: nextSettings.defaultSeoDescription,
      defaultOgImage: nextSettings.defaultOgImage,
      siteUrl: nextSettings.siteUrl,
      robotsIndexable: nextSettings.robotsIndexable,
      geminiEnabled: nextSettings.geminiEnabled,
      geminiModel: nextSettings.geminiModel
    });
    setSubtopicForm((prev) => {
      if (prev.categoryId || !nextCategories[0]) {
        return prev;
      }
      return { ...prev, categoryId: nextCategories[0].id };
    });

    setPostForm((prev) => {
      if (prev.categoryId || !nextCategories[0]) {
        return prev;
      }
      const categoryId = nextCategories[0].id;
      const matchingSubtopic = nextSubtopics.find((item) => item.categoryId === categoryId);
      return { ...prev, categoryId, subtopicId: matchingSubtopic?.id ?? "" };
    });

    setNotificationForm((prev) => {
      if (prev.topicId || !nextSubtopics[0]) {
        return prev;
      }
      return { ...prev, topicId: nextSubtopics[0].id };
    });
  }, []);
  useEffect(() => {
    if (!profile?.isAdmin) {
      return;
    }
    void refreshAll();
  }, [profile?.isAdmin, refreshAll]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setSiteOrigin(window.location.origin);
  }, []);

  const postTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    posts.forEach((post) => {
      map[post.id] = post.title;
    });
    return map;
  }, [posts]);

  if (loading) {
    return (
      <div className="app-shell">
        <Header onOpenLogin={() => undefined} />
        <main className="page-main">
          <div className="page-wrap">
            <div className="notice">Checking admin access...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <div className="app-shell">
        <Header onOpenLogin={() => undefined} />
        <main className="page-main">
          <div className="page-wrap">
            <div className="notice">Admin access required.</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (categoryEditingId) {
      await updateCategory(categoryEditingId, { ...categoryForm, slug: slugify(categoryForm.slug || categoryForm.name) });
      setStatus("Category updated.");
    } else {
      await createCategory({
        ...categoryForm,
        slug: slugify(categoryForm.slug || categoryForm.name),
        order: categories.length + 1
      });
      setStatus("Category created.");
    }

    setCategoryForm({ name: "", slug: "", description: "" });
    setCategoryEditingId("");
    await refreshAll();
  }

  async function handleSubtopicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (subtopicEditingId) {
      await updateSubtopic(subtopicEditingId, {
        categoryId: subtopicForm.categoryId,
        name: subtopicForm.name,
        slug: slugify(subtopicForm.slug || subtopicForm.name)
      });
      setStatus("Subtopic updated.");
    } else {
      await createSubtopic({
        categoryId: subtopicForm.categoryId,
        name: subtopicForm.name,
        slug: slugify(subtopicForm.slug || subtopicForm.name),
        order: subtopics.filter((item) => item.categoryId === subtopicForm.categoryId).length + 1
      });
      setStatus("Subtopic created.");
    }

    setSubtopicForm((prev) => ({ ...prev, name: "", slug: "" }));
    setSubtopicEditingId("");
    await refreshAll();
  }

  async function handleCoverImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadStatus("");
    setUploadingImage(true);

    try {
      const url = await uploadPostImage(file);
      setPostForm((prev) => ({ ...prev, coverImage: url }));
      setUploadStatus("Image uploaded and attached to cover image URL.");
    } catch {
      setUploadStatus("Image upload failed. Please check Firebase Storage setup, then try again.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handlePostSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const plainContent = postForm.content.replace(/<[^>]+>/g, " ").trim();
    if (!plainContent) {
      setStatus("Post content cannot be empty.");
      return;
    }

    const payload = {
      title: postForm.title,
      slug: slugify(postForm.slug || postForm.title),
      excerpt: postForm.excerpt,
      content: postForm.content,
      coverImage: postForm.coverImage,
      categoryId: postForm.categoryId,
      subtopicId: postForm.subtopicId,
      tags: postForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      seoTitle: postForm.seoTitle || postForm.title,
      seoDescription: postForm.seoDescription || postForm.excerpt,
      isPublished: postForm.isPublished,
      publishedAt: postForm.publishedAt
    };

    if (postEditingId) {
      await updatePost(postEditingId, payload);
      setStatus("Post updated.");
    } else {
      await createPost(payload);
      setStatus("Post created.");
    }

    setUploadStatus("");
    setPostForm(emptyPostForm);
    setPostEditingId("");
    await refreshAll();
  }

  async function handlePageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pageEditingId) {
      await updateCustomPage(pageEditingId, { ...pageForm, slug: slugify(pageForm.slug || pageForm.title) });
      setStatus("Custom page updated.");
    } else {
      await createCustomPage({ ...pageForm, slug: slugify(pageForm.slug || pageForm.title) });
      setStatus("Custom page created.");
    }

    setPageForm(emptyPageForm);
    setPageEditingId("");
    await refreshAll();
  }

  async function handleScriptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await createThirdPartyScript({
      ...scriptForm,
      enabled: true
    });

    setScriptForm({ name: "", src: "", location: "body" });
    setStatus("Script added.");
    await refreshAll();
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setAppearanceForm((prev) => ({ ...prev, logoImageUrl: url, logoMode: "image" }));
      setUploadStatus("Logo uploaded. Save settings to apply.");
    } catch {
      setUploadStatus("Logo upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleHeroMediaFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadStatus("");

    try {
      const url = await uploadSiteAsset(file);
      setHeroForm((prev) => ({ ...prev, source: url }));
      setUploadStatus("Hero media uploaded.");
    } catch {
      setUploadStatus("Hero media upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleHeroMediaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      section: heroForm.section,
      title: heroForm.title.trim(),
      source: heroForm.source.trim(),
      order: Number(heroForm.order || "0"),
      enabled: heroForm.enabled
    };

    if (!payload.title || !payload.source) {
      setStatus("Hero media title and source are required.");
      return;
    }

    if (heroEditingId) {
      await updateHeroMedia(heroEditingId, payload);
      setStatus("Hero media updated.");
    } else {
      await createHeroMedia(payload);
      setStatus("Hero media created.");
    }

    setHeroForm({ section: "video", title: "", source: "", order: "1", enabled: true });
    setHeroEditingId("");
    await refreshAll();
  }

  async function handleAppearanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await updateSiteAppearanceSettings({
      themeMode: appearanceForm.themeMode,
      logoMode: appearanceForm.logoMode,
      logoImageUrl: appearanceForm.logoImageUrl,
      logoSize: Number(appearanceForm.logoSize || "38"),
      logoTitleLine1: appearanceForm.logoTitleLine1,
      logoTitleLine2: appearanceForm.logoTitleLine2,
      logoAccentText: appearanceForm.logoAccentText,
      contentPreviewEnabled: appearanceForm.contentPreviewEnabled,
      contentPreviewPercent: Number(appearanceForm.contentPreviewPercent || "20"),
      defaultSeoTitle: appearanceForm.defaultSeoTitle,
      defaultSeoDescription: appearanceForm.defaultSeoDescription,
      defaultOgImage: appearanceForm.defaultOgImage,
      siteUrl: appearanceForm.siteUrl,
      robotsIndexable: appearanceForm.robotsIndexable,
      geminiEnabled: appearanceForm.geminiEnabled,
      geminiModel: appearanceForm.geminiModel
    });

    setStatus("Appearance and SEO settings updated.");
    await refreshAll();
  }

  async function handleGenerateWithGemini() {
    if (!appearanceForm.geminiEnabled) {
      setStatus("Enable Gemini in settings first.");
      return;
    }

    if (!aiPrompt.trim()) {
      setStatus("Enter a prompt for Gemini.");
      return;
    }

    setAiBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          model: appearanceForm.geminiModel,
          titleHint: postForm.title,
          excerptHint: postForm.excerpt
        })
      });

      const data = (await response.json()) as {
        title?: string;
        excerpt?: string;
        content?: string;
        seoTitle?: string;
        seoDescription?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Gemini generation failed.");
      }

      setPostForm((prev) => {
        const nextTitle = data.title?.trim() || prev.title;
        return {
          ...prev,
          title: nextTitle,
          slug: prev.slug || slugify(nextTitle),
          excerpt: data.excerpt?.trim() || prev.excerpt,
          content: data.content?.trim() || prev.content,
          seoTitle: data.seoTitle?.trim() || prev.seoTitle || nextTitle,
          seoDescription: data.seoDescription?.trim() || prev.seoDescription || prev.excerpt
        };
      });

      setStatus("Gemini content generated and added to form.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Gemini generation failed.");
    } finally {
      setAiBusy(false);
    }
  }
  async function handleNotificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await createNotification({
      title: notificationForm.title,
      message: notificationForm.message,
      target: notificationForm.target,
      topicId: notificationForm.target === "topic" ? notificationForm.topicId : ""
    });

    setNotificationForm((prev) => ({ ...prev, title: "", message: "" }));
    setStatus("Notification queued.");
    await refreshAll();
  }

  async function handleNavigationLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      label: navForm.label.trim(),
      href: navForm.href.trim(),
      location: navForm.location,
      order: Number(navForm.order || "0"),
      enabled: navForm.enabled,
      openInNewTab: navForm.openInNewTab
    };

    if (!payload.label || !payload.href) {
      setStatus("Link label and URL are required.");
      return;
    }

    if (navEditingId) {
      await updateNavigationLink(navEditingId, payload);
      setStatus("Navigation link updated.");
    } else {
      await createNavigationLink(payload);
      setStatus("Navigation link created.");
    }

    setNavForm({
      label: "",
      href: "",
      location: "header",
      order: "1",
      enabled: true,
      openInNewTab: false
    });
    setNavEditingId("");
    await refreshAll();
  }
  async function handleNotFoundSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await updateNotFoundSettings({
      notFoundRedirectType: notFoundForm.notFoundRedirectType,
      notFoundRedirectPath: notFoundForm.notFoundRedirectPath,
      notFoundButtonLabel: notFoundForm.notFoundButtonLabel
    });

    setStatus("404 page settings updated.");
    await refreshAll();
  }
  const filteredSubtopics = subtopics.filter((item) => item.categoryId === postForm.categoryId);

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => undefined} />
      <main className="page-main">
        <div className="admin-layout">
          <div className="label">Admin Panel</div>
          <h1 className="h2">Phase 2 CMS and Analytics</h1>
          <p className="body-txt">Only admins can create or update content. Users can submit only feedback.</p>
          {status ? <div className="notice">{status}</div> : null}

          <section className="admin-section admin-card">
            <h3>Analytics Dashboard</h3>
            <div className="admin-grid">
              <div className="notice"><strong>Active users:</strong> {analytics.activeUsers}</div>
              <div className="notice"><strong>Post views:</strong> {analytics.views}</div>
              <div className="notice"><strong>Downloads:</strong> {analytics.downloads}</div>
              <div className="notice"><strong>Feedback count:</strong> {analytics.feedbackCount}</div>
              <div className="notice"><strong>Subscriptions:</strong> {subscriptions.length}</div>
              <div className="notice"><strong>Notifications:</strong> {notifications.length}</div>
            </div>
            <div className="form-actions" style={{ marginTop: "0.8rem" }}>
              <button
                className="btn btn-outline"
                type="button"
                onClick={async () => {
                  await updateLiveTracking(!settings.liveTrackingEnabled);
                  await refreshAll();
                }}
              >
                Live Tracking: {settings.liveTrackingEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Theme, Logo, Preview and SEO Settings</h3>
            <p className="muted">Manage dark mode, logo, preview gate, Gemini helper and SEO defaults.</p>
            <form className="form-grid" onSubmit={handleAppearanceSubmit}>
              <select
                value={appearanceForm.themeMode}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, themeMode: event.target.value as SiteSettings["themeMode"] }))
                }
              >
                <option value="light">Light theme</option>
                <option value="dark">Dark theme</option>
              </select>
              <select
                value={appearanceForm.logoMode}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, logoMode: event.target.value as SiteSettings["logoMode"] }))
                }
              >
                <option value="text">Text logo</option>
                <option value="image">Image logo</option>
              </select>
              <input
                placeholder="Logo image URL"
                value={appearanceForm.logoImageUrl}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoImageUrl: event.target.value }))}
              />
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
              <input
                type="number"
                min={26}
                max={80}
                placeholder="Logo size (px)"
                value={appearanceForm.logoSize}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoSize: event.target.value }))}
              />
              <input
                placeholder="Logo line 1"
                value={appearanceForm.logoTitleLine1}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoTitleLine1: event.target.value }))}
              />
              <input
                placeholder="Logo line 2"
                value={appearanceForm.logoTitleLine2}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoTitleLine2: event.target.value }))}
              />
              <input
                placeholder="Logo accent text"
                value={appearanceForm.logoAccentText}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, logoAccentText: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.contentPreviewEnabled}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, contentPreviewEnabled: event.target.checked }))
                  }
                />
                Enable post preview gate before login
              </label>
              <input
                type="number"
                min={5}
                max={95}
                placeholder="Preview percent"
                value={appearanceForm.contentPreviewPercent}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, contentPreviewPercent: event.target.value }))
                }
              />
              <input
                placeholder="Default SEO title"
                value={appearanceForm.defaultSeoTitle}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, defaultSeoTitle: event.target.value }))}
              />
              <textarea
                rows={2}
                placeholder="Default SEO description"
                value={appearanceForm.defaultSeoDescription}
                onChange={(event) =>
                  setAppearanceForm((prev) => ({ ...prev, defaultSeoDescription: event.target.value }))
                }
              />
              <input
                placeholder="Default OG image URL"
                value={appearanceForm.defaultOgImage}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, defaultOgImage: event.target.value }))}
              />
              <input
                placeholder="Site URL (for sitemap and robots)"
                value={appearanceForm.siteUrl}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, siteUrl: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.robotsIndexable}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, robotsIndexable: event.target.checked }))
                  }
                />
                Allow robots indexing
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={appearanceForm.geminiEnabled}
                  onChange={(event) =>
                    setAppearanceForm((prev) => ({ ...prev, geminiEnabled: event.target.checked }))
                  }
                />
                Enable Gemini content tools
              </label>
              <input
                placeholder="Gemini model"
                value={appearanceForm.geminiModel}
                onChange={(event) => setAppearanceForm((prev) => ({ ...prev, geminiModel: event.target.value }))}
              />
              <button className="btn btn-primary" type="submit">
                Save Appearance and SEO
              </button>
            </form>
            <div className="notice" style={{ marginTop: "0.7rem" }}>
              Auto generated: <strong>/robots.txt</strong> and <strong>/sitemap.xml</strong>
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Hero Slider Media (Image and Video)</h3>
            <form className="form-grid" onSubmit={handleHeroMediaSubmit}>
              <select
                value={heroForm.section}
                onChange={(event) =>
                  setHeroForm((prev) => ({ ...prev, section: event.target.value as HeroMediaItem["section"] }))
                }
              >
                <option value="video">Video slide</option>
                <option value="image">Image slide</option>
              </select>
              <input
                placeholder="Slide title"
                value={heroForm.title}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <input
                placeholder="Media URL"
                value={heroForm.source}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, source: event.target.value }))}
                required
              />
              <input type="file" accept="image/*,video/*" onChange={handleHeroMediaFileUpload} />
              <input
                type="number"
                min={0}
                placeholder="Order"
                value={heroForm.order}
                onChange={(event) => setHeroForm((prev) => ({ ...prev, order: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={heroForm.enabled}
                  onChange={(event) => setHeroForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {heroEditingId ? "Update Media" : "Add Media"}
                </button>
                {heroEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setHeroEditingId("");
                      setHeroForm({ section: "video", title: "", source: "", order: "1", enabled: true });
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {heroMedia.length ? (
                heroMedia.map((item) => (
                  <div className="notice" key={item.id}>
                    <strong>{item.title}</strong>
                    <p className="muted">
                      {item.section} | order {item.order} | {item.enabled ? "enabled" : "disabled"}
                    </p>
                    <p className="muted">{item.source}</p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setHeroEditingId(item.id);
                          setHeroForm({
                            section: item.section,
                            title: item.title,
                            source: item.source,
                            order: String(item.order),
                            enabled: item.enabled
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteHeroMedia(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No hero media configured yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>404 Redirect Settings</h3>
            <p className="muted">Configure where users should go from invalid URLs.</p>
            <form className="form-grid" onSubmit={handleNotFoundSettingsSubmit}>
              <select
                value={notFoundForm.notFoundRedirectType}
                onChange={(event) =>
                  setNotFoundForm((prev) => ({
                    ...prev,
                    notFoundRedirectType: event.target.value as SiteSettings["notFoundRedirectType"]
                  }))
                }
              >
                <option value="home">Redirect to home page (/)</option>
                <option value="custom">Redirect to custom page/path</option>
              </select>

              {notFoundForm.notFoundRedirectType === "custom" ? (
                <input
                  placeholder="/pages/privacy-policy"
                  value={notFoundForm.notFoundRedirectPath}
                  onChange={(event) =>
                    setNotFoundForm((prev) => ({ ...prev, notFoundRedirectPath: event.target.value }))
                  }
                  required
                />
              ) : null}

              <input
                placeholder="Button label"
                value={notFoundForm.notFoundButtonLabel}
                onChange={(event) =>
                  setNotFoundForm((prev) => ({ ...prev, notFoundButtonLabel: event.target.value }))
                }
                required
              />

              <button className="btn btn-primary" type="submit">
                Save 404 Settings
              </button>
            </form>
            <div className="notice" style={{ marginTop: "0.8rem" }}>
              Current target: {settings.notFoundRedirectType === "custom" ? settings.notFoundRedirectPath : "/"}
            </div>
          </section>
          <section className="admin-section admin-card">
            <h3>Menu and Footer Links</h3>
            <p className="muted">Create links for header menu and footer pages list.</p>
            <form className="form-grid" onSubmit={handleNavigationLinkSubmit}>
              <input
                placeholder="Link label"
                value={navForm.label}
                onChange={(event) => setNavForm((prev) => ({ ...prev, label: event.target.value }))}
                required
              />
              <input
                placeholder="/pages/about or #topics or https://example.com"
                value={navForm.href}
                onChange={(event) => setNavForm((prev) => ({ ...prev, href: event.target.value }))}
                required
              />
              <select
                value={navForm.location}
                onChange={(event) =>
                  setNavForm((prev) => ({ ...prev, location: event.target.value as NavigationLink["location"] }))
                }
              >
                <option value="header">Header menu</option>
                <option value="footer">Footer links</option>
              </select>
              <input
                type="number"
                min={0}
                placeholder="Display order"
                value={navForm.order}
                onChange={(event) => setNavForm((prev) => ({ ...prev, order: event.target.value }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={navForm.enabled}
                  onChange={(event) => setNavForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                Enabled
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={navForm.openInNewTab}
                  onChange={(event) => setNavForm((prev) => ({ ...prev, openInNewTab: event.target.checked }))}
                />
                Open in new tab
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {navEditingId ? "Update Link" : "Add Link"}
                </button>
                {navEditingId ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setNavEditingId("");
                      setNavForm({
                        label: "",
                        href: "",
                        location: "header",
                        order: "1",
                        enabled: true,
                        openInNewTab: false
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-like">
              {navigationLinks.length ? (
                navigationLinks.map((item) => (
                  <div className="notice" key={item.id}>
                    <strong>{item.label}</strong>
                    <p className="muted">
                      {item.location} | {item.href} | order {item.order} | {item.enabled ? "enabled" : "disabled"}
                    </p>
                    <div className="form-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => {
                          setNavEditingId(item.id);
                          setNavForm({
                            label: item.label,
                            href: item.href,
                            location: item.location,
                            order: String(item.order),
                            enabled: item.enabled,
                            openInNewTab: item.openInNewTab
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => void deleteNavigationLink(item.id).then(refreshAll)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No navigation links configured yet.</p>
              )}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Category Management</h3>
            <form className="form-grid" onSubmit={handleCategorySubmit}>
              <input placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <input placeholder="Category slug" value={categoryForm.slug} onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <textarea rows={2} placeholder="Description" value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} required />
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{categoryEditingId ? "Update Category" : "Add Category"}</button>
                {categoryEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setCategoryEditingId(""); setCategoryForm({ name: "", slug: "", description: "" }); }}>Cancel Edit</button> : null}
              </div>
            </form>
            <div className="table-like">
              {categories.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.name}</strong> <span className="muted">({item.slug})</span>
                  <p className="muted">{item.description}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => { setCategoryEditingId(item.id); setCategoryForm({ name: item.name, slug: item.slug, description: item.description }); }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteCategory(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Subtopic Management</h3>
            <form className="form-grid" onSubmit={handleSubtopicSubmit}>
              <select value={subtopicForm.categoryId} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
                ))}
              </select>
              <input placeholder="Subtopic name" value={subtopicForm.name} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <input placeholder="Subtopic slug" value={subtopicForm.slug} onChange={(event) => setSubtopicForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{subtopicEditingId ? "Update Subtopic" : "Add Subtopic"}</button>
                {subtopicEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setSubtopicEditingId(""); setSubtopicForm((prev) => ({ ...prev, name: "", slug: "" })); }}>Cancel Edit</button> : null}
              </div>
            </form>
            <div className="table-like">
              {subtopics.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.name}</strong> <span className="muted">({item.slug})</span>
                  <p className="muted">Category: {categories.find((cat) => cat.id === item.categoryId)?.name ?? item.categoryId}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => { setSubtopicEditingId(item.id); setSubtopicForm({ categoryId: item.categoryId, name: item.name, slug: item.slug }); }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteSubtopic(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Post Management (SEO included)</h3>
            <div className="notice" style={{ marginBottom: "0.9rem" }}>
              <strong>Gemini AI Assistant</strong>
              <p className="muted">Set server env `GEMINI_API_KEY`, then use prompt to generate title/content/SEO draft.</p>
              <textarea
                rows={3}
                placeholder="Write a beginner post about Ohms law with examples"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
              />
              <div className="form-actions">
                <button className="btn btn-outline" type="button" onClick={handleGenerateWithGemini} disabled={aiBusy}>
                  {aiBusy ? "Generating..." : "Generate with Gemini"}
                </button>
              </div>
            </div>
            <form className="form-grid" onSubmit={handlePostSubmit}>
              <input placeholder="Title" value={postForm.title} onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input placeholder="Slug" value={postForm.slug} onChange={(event) => setPostForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <textarea rows={2} placeholder="Excerpt" value={postForm.excerpt} onChange={(event) => setPostForm((prev) => ({ ...prev, excerpt: event.target.value }))} required />
              <RichPostEditor
                value={postForm.content}
                onChange={(value) => setPostForm((prev) => ({ ...prev, content: value }))}
              />
              <input placeholder="Cover image URL" value={postForm.coverImage} onChange={(event) => setPostForm((prev) => ({ ...prev, coverImage: event.target.value }))} required />
              <input type="file" accept="image/*" onChange={handleCoverImageUpload} />
              {uploadingImage ? <p className="muted">Uploading image...</p> : null}
              {uploadStatus ? <div className="notice">{uploadStatus}</div> : null}
              <input placeholder="Tags (comma separated)" value={postForm.tags} onChange={(event) => setPostForm((prev) => ({ ...prev, tags: event.target.value }))} />
              <select value={postForm.categoryId} onChange={(event) => {
                const categoryId = event.target.value;
                const nextSubtopic = subtopics.find((item) => item.categoryId === categoryId);
                setPostForm((prev) => ({ ...prev, categoryId, subtopicId: nextSubtopic?.id ?? "" }));
              }}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <select value={postForm.subtopicId} onChange={(event) => setPostForm((prev) => ({ ...prev, subtopicId: event.target.value }))}>
                {filteredSubtopics.map((subtopic) => <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>)}
              </select>
              <input type="date" value={postForm.publishedAt} onChange={(event) => setPostForm((prev) => ({ ...prev, publishedAt: event.target.value }))} />
              <input placeholder="SEO title" value={postForm.seoTitle} onChange={(event) => setPostForm((prev) => ({ ...prev, seoTitle: event.target.value }))} />
              <textarea rows={2} placeholder="SEO description" value={postForm.seoDescription} onChange={(event) => setPostForm((prev) => ({ ...prev, seoDescription: event.target.value }))} />
              <label><input type="checkbox" checked={postForm.isPublished} onChange={(event) => setPostForm((prev) => ({ ...prev, isPublished: event.target.checked }))} /> Publish now</label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{postEditingId ? "Update Post" : "Add Post"}</button>
                {postEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setPostEditingId(""); setPostForm(emptyPostForm); }}>Cancel Edit</button> : null}
              </div>
            </form>

            <div className="table-like">
              {posts.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.title}</strong>
                  <p className="muted">/{item.slug}</p>
                  <p className="muted">{item.excerpt}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => {
                      setPostEditingId(item.id);
                      setPostForm({
                        title: item.title,
                        slug: item.slug,
                        excerpt: item.excerpt,
                        content: item.content,
                        coverImage: item.coverImage,
                        categoryId: item.categoryId,
                        subtopicId: item.subtopicId,
                        tags: item.tags.join(", "),
                        seoTitle: item.seoTitle ?? "",
                        seoDescription: item.seoDescription ?? "",
                        isPublished: item.isPublished,
                        publishedAt: item.publishedAt
                      });
                    }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deletePost(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Category-wise and Post-wise Links</h3>
            <p className="muted">Use these links for sharing category pages and individual posts.</p>
            <div className="table-like">
              <div className="notice">
                <strong>Category links</strong>
                {categories.length ? (
                  categories.map((item) => {
                    const path = `/?category=${encodeURIComponent(item.slug)}#categories`;
                    const href = `${siteOrigin}${path}`;
                    return (
                      <p className="muted" key={`category-link-${item.id}`}>
                        <a className="nav-link" href={href} target="_blank" rel="noreferrer">{href}</a>
                      </p>
                    );
                  })
                ) : (
                  <p className="muted">No categories available.</p>
                )}
              </div>
              <div className="notice">
                <strong>Post links</strong>
                {posts.length ? (
                  posts.map((item) => {
                    const path = `/post/${item.slug}`;
                    const href = `${siteOrigin}${path}`;
                    return (
                      <p className="muted" key={`post-link-${item.id}`}>
                        <a className="nav-link" href={href} target="_blank" rel="noreferrer">{href}</a>
                      </p>
                    );
                  })
                ) : (
                  <p className="muted">No posts available.</p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Custom Page Management</h3>
            <form className="form-grid" onSubmit={handlePageSubmit}>
              <input placeholder="Page title" value={pageForm.title} onChange={(event) => setPageForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input placeholder="Page slug" value={pageForm.slug} onChange={(event) => setPageForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <textarea rows={7} placeholder="Page content" value={pageForm.content} onChange={(event) => setPageForm((prev) => ({ ...prev, content: event.target.value }))} required />
              <input placeholder="SEO title" value={pageForm.seoTitle} onChange={(event) => setPageForm((prev) => ({ ...prev, seoTitle: event.target.value }))} />
              <textarea rows={2} placeholder="SEO description" value={pageForm.seoDescription} onChange={(event) => setPageForm((prev) => ({ ...prev, seoDescription: event.target.value }))} />
              <label><input type="checkbox" checked={pageForm.isPublished} onChange={(event) => setPageForm((prev) => ({ ...prev, isPublished: event.target.checked }))} /> Publish page</label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{pageEditingId ? "Update Page" : "Create Page"}</button>
                {pageEditingId ? <button className="btn btn-outline" type="button" onClick={() => { setPageEditingId(""); setPageForm(emptyPageForm); }}>Cancel Edit</button> : null}
              </div>
            </form>
            <div className="table-like">
              {pages.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.title}</strong> <span className="muted">(/pages/{item.slug})</span>
                  <p className="muted">{item.isPublished ? "Published" : "Draft"}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => {
                      setPageEditingId(item.id);
                      setPageForm({
                        title: item.title,
                        slug: item.slug,
                        content: item.content,
                        seoTitle: item.seoTitle ?? "",
                        seoDescription: item.seoDescription ?? "",
                        isPublished: item.isPublished
                      });
                    }}>Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteCustomPage(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Third-Party Scripts</h3>
            <form className="form-grid" onSubmit={handleScriptSubmit}>
              <input placeholder="Script name" value={scriptForm.name} onChange={(event) => setScriptForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <input placeholder="https://example.com/script.js" value={scriptForm.src} onChange={(event) => setScriptForm((prev) => ({ ...prev, src: event.target.value }))} required />
              <select value={scriptForm.location} onChange={(event) => setScriptForm((prev) => ({ ...prev, location: event.target.value as "head" | "body" }))}>
                <option value="head">Head</option>
                <option value="body">Body</option>
              </select>
              <button className="btn btn-primary" type="submit">Add Script</button>
            </form>
            <div className="table-like">
              {scripts.length ? scripts.map((item) => (
                <div className="notice" key={item.id}>
                  <strong>{item.name}</strong>
                  <p className="muted">{item.src}</p>
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => void updateThirdPartyScript(item.id, { enabled: !item.enabled }).then(refreshAll)}>{item.enabled ? "Disable" : "Enable"}</button>
                    <button className="btn btn-outline" type="button" onClick={() => void deleteThirdPartyScript(item.id).then(refreshAll)}>Delete</button>
                  </div>
                </div>
              )) : <p className="muted">No scripts configured.</p>}
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Subscription and Notification Center</h3>
            <form className="form-grid" onSubmit={handleNotificationSubmit}>
              <input placeholder="Notification title" value={notificationForm.title} onChange={(event) => setNotificationForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <textarea rows={2} placeholder="Notification message" value={notificationForm.message} onChange={(event) => setNotificationForm((prev) => ({ ...prev, message: event.target.value }))} required />
              <select value={notificationForm.target} onChange={(event) => setNotificationForm((prev) => ({ ...prev, target: event.target.value as "website" | "topic" }))}>
                <option value="website">Website subscribers</option>
                <option value="topic">Specific topic subscribers</option>
              </select>
              {notificationForm.target === "topic" ? (
                <select value={notificationForm.topicId} onChange={(event) => setNotificationForm((prev) => ({ ...prev, topicId: event.target.value }))}>
                  {subtopics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              ) : null}
              <button className="btn btn-primary" type="submit">Send Update</button>
            </form>

            <div className="table-like">
              <div className="notice">
                <strong>Subscribers ({subscriptions.length})</strong>
                <p className="muted">Latest 10</p>
                {subscriptions.slice(0, 10).map((item) => (
                  <p key={item.id} className="muted">{item.email} {item.topicId ? `-> ${item.topicId}` : "-> website"}</p>
                ))}
              </div>
              <div className="notice">
                <strong>Recent notifications</strong>
                {notifications.slice(0, 8).map((item) => (
                  <p key={item.id} className="muted">{item.title} ({item.target})</p>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-section admin-card">
            <h3>Post-wise Feedback</h3>
            <div className="table-like">
              {feedback.length ? (
                feedback.map((item) => (
                  <article className="feedback-card" key={item.id}>
                    <strong>{postTitleById[item.postId] ?? item.postId}</strong>
                    <p className="muted">Rating: {item.rating}/5</p>
                    <p>{item.message}</p>
                    <p className="muted">by {item.userEmail} on {new Date(item.createdAt).toLocaleDateString()}</p>
                  </article>
                ))
              ) : (
                <p className="muted">No feedback submitted yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


























