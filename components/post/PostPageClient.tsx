"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotificationStrip } from "@/components/layout/NotificationStrip";
import { ArticleRenderer } from "@/components/post/ArticleRenderer";
import { saveFeedback, saveSubscription, trackAnalyticsEvent } from "@/lib/firebase/data";
import { Post } from "@/lib/types";

interface PostPageClientProps {
  initialPost: Post | null;
  initialRelated: Post[];
}

export function PostPageClient({ initialPost, initialRelated }: PostPageClientProps) {
  const { user } = useAuth();

  const post = initialPost;
  const related = initialRelated;
  const [loginOpen, setLoginOpen] = useState(false);

  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState("5");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");

  const previewTriggerRef = useRef<HTMLDivElement | null>(null);

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

    const content = post.content;
    const htmlLike = /<\/?[a-z][\s\S]*>/i.test(content);

    if (htmlLike && typeof window !== "undefined") {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const blocks = Array.from(doc.body.childNodes).filter((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            return Boolean(node.textContent?.trim());
          }
          return node.nodeType === Node.ELEMENT_NODE;
        });

        const previewCount = Math.max(1, Math.ceil(blocks.length * 0.2));
        const container = document.createElement("div");
        blocks.slice(0, previewCount).forEach((node) => {
          container.appendChild(node.cloneNode(true));
        });
        return container.innerHTML;
      } catch {
        return content;
      }
    }

    const sections = content.split(/\n\n+/).filter(Boolean);
    const previewCount = Math.max(1, Math.ceil(sections.length * 0.2));
    return sections.slice(0, previewCount).join("\n\n");
  }, [post]);

  useEffect(() => {
    if (!previewTriggerRef.current || user) {
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
      { threshold: 0.8 }
    );

    observer.observe(previewTriggerRef.current);

    return () => observer.disconnect();
  }, [user, previewContent]);

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

  function handlePdfDownload() {
    if (!post) {
      return;
    }

    const blob = new Blob([`${post.title}\n\n${post.content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${post.slug}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    void trackAnalyticsEvent({
      type: "pdf_download",
      postId: post.id,
      userId: user?.uid ?? ""
    });
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
                <Image src={post.coverImage} alt={post.title} width={1400} height={800} />
                <div className="post-header">
                  <div className="label">{post.publishedAt}</div>
                  <h1>{post.title}</h1>
                  <p className="meta">{post.excerpt}</p>
                  <div className="form-actions" style={{ marginTop: "1rem" }}>
                    <button type="button" className="btn btn-outline" onClick={handlePdfDownload}>
                      Download Notes
                    </button>
                  </div>
                </div>
              </article>

              <section className="post-content" style={{ marginTop: "1rem" }}>
                <div className="post-content-inner">
                  <ArticleRenderer content={user ? post.content : previewContent} />
                </div>

                {!user ? (
                  <>
                    <div ref={previewTriggerRef} />
                    <div className="locked-overlay">
                      <h3 style={{ margin: 0, fontFamily: "var(--fd)" }}>20% preview reached</h3>
                      <p className="meta">Login is required to unlock full post content.</p>
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
                        <Image src={item.coverImage} alt={item.title} width={1200} height={800} />
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
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}



