"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { DesignFrame } from "@/components/design/DesignFrame";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotificationStrip } from "@/components/layout/NotificationStrip";
import { ArticleRenderer } from "@/components/post/ArticleRenderer";
import { getSiteSettings, saveFeedback, saveSubscription, trackAnalyticsEvent } from "@/lib/firebase/data";
import { Post } from "@/lib/types";

interface PostPageClientProps {
  initialPost: Post | null;
  initialRelated: Post[];
  initialPreviewEnabled: boolean;
  initialPreviewPercent: number;
}

const FALLBACK_POST_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

function getSafeImageSrc(value: string | undefined): string {
  const src = (value ?? "").trim();
  if (!src) {
    return FALLBACK_POST_IMAGE;
  }
  if (src.startsWith("/") || /^https?:\/\//i.test(src)) {
    return src;
  }
  return FALLBACK_POST_IMAGE;
}

function extractReadableText(content: string): string {
  const htmlLike = /<\/?[a-z][\s\S]*>/i.test(content);

  if (!htmlLike) {
    return content.replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ").trim();
  }

  if (typeof window !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
    } catch {
      return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildPreviewContent(content: string, percent: number): string {
  const cleanText = extractReadableText(content);
  if (!cleanText) {
    return "";
  }

  const safePercent = Math.max(5, Math.min(95, percent || 20));
  const targetLength = Math.max(120, Math.ceil((cleanText.length * safePercent) / 100));
  const clippedLength = Math.min(Math.max(targetLength, 1), Math.max(cleanText.length - 1, 1));

  const clipped = cleanText.slice(0, clippedLength).trimEnd();
  const withHint = `${clipped} ... ... Read more to login.`;
  return withHint;
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function openPrintDialogAsPdf(title: string, content: string): void {
  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 24px; color: #111; }
          h1 { margin-top: 0; }
          pre { background: #111; color: #fff; padding: 12px; border-radius: 6px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <pre>${content.replace(/</g, "&lt;")}</pre>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  popup.print();
}

export function PostPageClient({
  initialPost,
  initialRelated,
  initialPreviewEnabled,
  initialPreviewPercent
}: PostPageClientProps) {
  const { user } = useAuth();

  const post = initialPost;
  const related = initialRelated;
  const [loginOpen, setLoginOpen] = useState(false);

  const [previewEnabled, setPreviewEnabled] = useState(initialPreviewEnabled);
  const [previewPercent, setPreviewPercent] = useState(initialPreviewPercent);

  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState("5");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  const previewTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function refreshSettings() {
      try {
        const settings = await getSiteSettings();
        setPreviewEnabled(settings.contentPreviewEnabled);
        setPreviewPercent(settings.contentPreviewPercent);
      } catch {
        setPreviewEnabled(initialPreviewEnabled);
        setPreviewPercent(initialPreviewPercent);
      }
    }

    void refreshSettings();
  }, [initialPreviewEnabled, initialPreviewPercent]);

  useEffect(() => {
    if (!post) {
      return;
    }

    void trackAnalyticsEvent({
      type: "post_view",
      postId: post.id,
      userId: user?.uid ?? ""
    });
  }, [post, user?.uid]);

  const previewContent = useMemo(() => {
    if (!post) {
      return "";
    }
    const source = post.contentMode === "design" ? `${post.title}\n\n${post.excerpt}` : post.content;
    return buildPreviewContent(source, previewPercent);
  }, [post, previewPercent]);

  const shouldLockContent = Boolean(post && previewEnabled && !user);

  useEffect(() => {
    if (!previewTriggerRef.current || !shouldLockContent) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoginOpen(true);
          }
        });
      },
      { threshold: 0.7 }
    );

    observer.observe(previewTriggerRef.current);
    return () => observer.disconnect();
  }, [shouldLockContent, previewContent]);

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackStatus("");

    if (!post || !user?.email) {
      setFeedbackStatus("Please login first to submit feedback.");
      setLoginOpen(true);
      return;
    }

    if (!feedbackText.trim()) {
      setFeedbackStatus("Please write feedback before submitting.");
      return;
    }

    try {
      await saveFeedback({
        postId: post.id,
        userId: user.uid,
        userEmail: user.email,
        rating: Number(rating),
        message: feedbackText.trim()
      });
      setFeedbackStatus("Feedback sent. Thank you.");
      setFeedbackText("");
      setRating("5");
    } catch {
      setFeedbackStatus("Could not send feedback. Please retry.");
    }
  }

  async function handleTopicSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubscribeStatus("");

    if (!post) {
      return;
    }

    const emailToUse = user?.email ?? subscribeEmail;
    if (!emailToUse) {
      setSubscribeStatus("Enter your email or login first.");
      return;
    }

    try {
      await saveSubscription(emailToUse, post.subtopicId);
      setSubscribeStatus("Subscribed to topic updates.");
      setSubscribeEmail("");
    } catch {
      setSubscribeStatus("Subscription failed. Try again.");
    }
  }

  function handleDownloadText() {
    if (!post) {
      return;
    }

    const textPayload = `${post.title}\n\n${extractReadableText(post.content)}`;
    downloadTextFile(`${post.slug}.txt`, textPayload);
    void trackAnalyticsEvent({
      type: "pdf_download",
      postId: post.id,
      userId: user?.uid ?? ""
    });
    setDownloadModalOpen(false);
  }

  function handleDownloadPdf() {
    if (!post) {
      return;
    }

    const textPayload = `${post.title}\n\n${extractReadableText(post.content)}`;
    openPrintDialogAsPdf(post.title, textPayload);
    void trackAnalyticsEvent({
      type: "pdf_download",
      postId: post.id,
      userId: user?.uid ?? ""
    });
    setDownloadModalOpen(false);
  }

  async function handleSharePost() {
    if (!post || typeof window === "undefined") {
      return;
    }

    const shareUrl = `${window.location.origin}/post/${post.slug}`;
    setShareStatus("");

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url: shareUrl });
        setShareStatus("Post shared successfully.");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Post link copied to clipboard.");
      }

      void trackAnalyticsEvent({
        type: "post_share",
        postId: post.id,
        userId: user?.uid ?? ""
      });
    } catch {
      setShareStatus("Share cancelled or failed.");
    }
  }

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => setLoginOpen(true)} />
      <main className="page-main">
        <NotificationStrip />
        <div className="page-wrap">
          <p className="breadcrumb">
            <Link href="/">Home</Link> / Post
          </p>

          {!post ? (
            <div className="notice">
              Post not found. <Link href="/">Go back home</Link>
            </div>
          ) : (
            <>
              <article className="post-hero">
                <Image src={getSafeImageSrc(post.coverImage)} alt={post.title} width={1400} height={800} />
                <div className="post-header">
                  <div className="label">{post.publishedAt}</div>
                  <h1>{post.title}</h1>
                  <p className="meta">{post.excerpt}</p>
                  <div className="post-actions-row" style={{ marginTop: "1rem" }}>
                    <button type="button" className="btn btn-primary" onClick={() => setDownloadModalOpen(true)}>
                      Download
                    </button>
                    <button type="button" className="share-btn" onClick={handleSharePost}>
                      Share
                    </button>
                  </div>
                  {shareStatus ? <p className="muted" style={{ marginTop: "0.5rem" }}>{shareStatus}</p> : null}
                </div>
              </article>

              <section className="post-content" style={{ marginTop: "1rem" }}>
                <div className="post-content-inner">
                  {shouldLockContent ? (
                    <ArticleRenderer content={previewContent} />
                  ) : post.contentMode === "design" ? (
                    <DesignFrame
                      title={post.title}
                      html={post.designHtml}
                      css={post.designCss}
                      js={post.designJs}
                      minHeight={620}
                    />
                  ) : (
                    <ArticleRenderer content={post.content} />
                  )}
                </div>

                {shouldLockContent ? (
                  <>
                    <div ref={previewTriggerRef} />
                    <div className="locked-overlay">
                      <h3 style={{ margin: 0, fontFamily: "var(--fd)" }}>{previewPercent}% preview reached</h3>
                      <p className="meta"><span className="read-more-highlight">Read more to login.</span> Unlock the full content.</p>
                      <button className="btn btn-primary" onClick={() => setLoginOpen(true)}>
                        Login to Continue
                      </button>
                    </div>
                  </>
                ) : null}
              </section>

              <section className="post-content" style={{ marginTop: "1rem" }}>
                <div className="post-content-inner">
                  <div className="label">Topic Updates</div>
                  <h2 className="h2" style={{ marginTop: "0.5rem" }}>
                    Subscribe for updates
                  </h2>
                  <form className="form-grid" onSubmit={handleTopicSubscribe}>
                    {!user ? (
                      <input
                        type="email"
                        placeholder="Email for updates"
                        value={subscribeEmail}
                        onChange={(event) => setSubscribeEmail(event.target.value)}
                      />
                    ) : (
                      <div className="notice">Subscribed as {user.email}</div>
                    )}
                    <button type="submit" className="btn btn-outline">
                      Subscribe to this topic
                    </button>
                    {subscribeStatus ? <div className="notice">{subscribeStatus}</div> : null}
                  </form>
                </div>
              </section>

              <section className="post-content" style={{ marginTop: "1rem" }}>
                <div className="post-content-inner">
                  <div className="label">Feedback</div>
                  <h2 className="h2" style={{ marginTop: "0.5rem" }}>
                    Share your feedback
                  </h2>
                  <p className="body-txt">Users can only submit feedback. Posting new content is admin-only.</p>

                  <form className="form-grid" onSubmit={handleFeedbackSubmit}>
                    <select value={rating} onChange={(event) => setRating(event.target.value)}>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Okay</option>
                      <option value="2">2 - Needs work</option>
                      <option value="1">1 - Poor</option>
                    </select>
                    <textarea
                      rows={4}
                      placeholder="Write your feedback"
                      value={feedbackText}
                      onChange={(event) => setFeedbackText(event.target.value)}
                    />
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Submit Feedback
                      </button>
                      {!user ? (
                        <button type="button" className="btn btn-outline" onClick={() => setLoginOpen(true)}>
                          Login
                        </button>
                      ) : null}
                    </div>
                    {feedbackStatus ? <div className="notice">{feedbackStatus}</div> : null}
                  </form>
                </div>
              </section>

              {related.length ? (
                <section className="section" style={{ paddingInline: 0 }}>
                  <div className="label">Next Topics</div>
                  <h2 className="h2">Continue learning</h2>
                  <div className="card-grid">
                    {related.map((item) => (
                      <article className="post-card" key={item.id}>
                        <Image src={getSafeImageSrc(item.coverImage)} alt={item.title} width={1200} height={800} />
                        <h3>{item.title}</h3>
                        <p className="meta">{item.excerpt}</p>
                        <Link href={`/post/${item.slug}`} className="btn btn-outline" style={{ marginTop: "0.8rem" }}>
                          Open
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      <Footer />

      {downloadModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDownloadModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Download Post</h3>
            <p>Choose your download format.</p>
            <div className="download-modal-grid">
              <button type="button" className="download-box-btn" onClick={handleDownloadText}>
                Download Text
              </button>
              <button type="button" className="download-box-btn" onClick={handleDownloadPdf}>
                Download PDF
              </button>
            </div>
            <div className="form-actions" style={{ marginTop: "0.8rem" }}>
              <button className="btn btn-outline" type="button" onClick={() => setDownloadModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}









