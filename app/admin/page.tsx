"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  createCategory,
  createCustomPage,
  createNotification,
  createPost,
  createSubtopic,
  createThirdPartyScript,
  deleteCategory,
  deleteCustomPage,
  deletePost,
  deleteSubtopic,
  deleteThirdPartyScript,
  getAnalyticsSummary,
  getCategories,
  getCustomPages,
  getFeedback,
  getNotifications,
  getPosts,
  getSiteSettings,
  getSubtopics,
  getThirdPartyScripts,
  listSubscriptions,
  updateCategory,
  updateCustomPage,
  updateLiveTracking,
  updatePost,
  updateSubtopic,
  updateThirdPartyScript
} from "@/lib/firebase/data";
import {
  AnalyticsSummary,
  Category,
  CustomPage,
  Feedback,
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
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    activeUsers: 0,
    views: 0,
    downloads: 0,
    feedbackCount: 0
  });
  const [settings, setSettings] = useState<SiteSettings>({
    id: "global",
    liveTrackingEnabled: true,
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

  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", target: "website" as "website" | "topic", topicId: "" });

  const [status, setStatus] = useState("");

  const refreshAll = useCallback(async () => {
    const [
      nextCategories,
      nextSubtopics,
      nextPosts,
      nextFeedback,
      nextPages,
      nextScripts,
      nextSubscriptions,
      nextNotifications,
      nextAnalytics,
      nextSettings
    ] = await Promise.all([
      getCategories(),
      getSubtopics(),
      getPosts({ includeDrafts: true }),
      getFeedback(),
      getCustomPages(true),
      getThirdPartyScripts(),
      listSubscriptions(),
      getNotifications(),
      getAnalyticsSummary(),
      getSiteSettings()
    ]);

    setCategories(nextCategories);
    setSubtopics(nextSubtopics);
    setPosts(nextPosts);
    setFeedback(nextFeedback);
    setPages(nextPages);
    setScripts(nextScripts);
    setSubscriptions(nextSubscriptions);
    setNotifications(nextNotifications);
    setAnalytics(nextAnalytics);
    setSettings(nextSettings);

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

  const postTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    posts.forEach((post) => {
      map[post.id] = post.title;
    });
    return map;
  }, [posts]);

  if (loading) {
    return <div className="page-wrap">Checking admin access...</div>;
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
      </div>
    );
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (categoryEditingId) {
      await updateCategory(categoryEditingId, categoryForm);
      setStatus("Category updated.");
    } else {
      await createCategory({
        ...categoryForm,
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
        slug: subtopicForm.slug
      });
      setStatus("Subtopic updated.");
    } else {
      await createSubtopic({
        categoryId: subtopicForm.categoryId,
        name: subtopicForm.name,
        slug: subtopicForm.slug,
        order: subtopics.filter((item) => item.categoryId === subtopicForm.categoryId).length + 1
      });
      setStatus("Subtopic created.");
    }

    setSubtopicForm((prev) => ({ ...prev, name: "", slug: "" }));
    setSubtopicEditingId("");
    await refreshAll();
  }

  async function handlePostSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const payload = {
      title: postForm.title,
      slug: postForm.slug,
      excerpt: postForm.excerpt,
      content: postForm.content,
      coverImage: postForm.coverImage,
      categoryId: postForm.categoryId,
      subtopicId: postForm.subtopicId,
      tags: postForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      seoTitle: postForm.seoTitle,
      seoDescription: postForm.seoDescription,
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

    setPostForm(emptyPostForm);
    setPostEditingId("");
    await refreshAll();
  }

  async function handlePageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pageEditingId) {
      await updateCustomPage(pageEditingId, pageForm);
      setStatus("Custom page updated.");
    } else {
      await createCustomPage(pageForm);
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
            <form className="form-grid" onSubmit={handlePostSubmit}>
              <input placeholder="Title" value={postForm.title} onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input placeholder="Slug" value={postForm.slug} onChange={(event) => setPostForm((prev) => ({ ...prev, slug: event.target.value }))} required />
              <textarea rows={2} placeholder="Excerpt" value={postForm.excerpt} onChange={(event) => setPostForm((prev) => ({ ...prev, excerpt: event.target.value }))} required />
              <textarea rows={8} placeholder="Post content" value={postForm.content} onChange={(event) => setPostForm((prev) => ({ ...prev, content: event.target.value }))} required />
              <input placeholder="Cover image URL" value={postForm.coverImage} onChange={(event) => setPostForm((prev) => ({ ...prev, coverImage: event.target.value }))} required />
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



