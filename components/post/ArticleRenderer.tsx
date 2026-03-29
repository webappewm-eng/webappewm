"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWebinarBySlug } from "@/lib/firebase/data";
import { Webinar } from "@/lib/types";

type Segment =
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "html"; html: string }
  | { type: "webinar"; slug: string };

const WEBINAR_SHORTCODE_REGEX = /\[webinar:([a-z0-9-]+)\]/gi;

function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function isSafeUrl(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || url.startsWith("/") || url.startsWith("#");
}

function sanitizeHtml(raw: string): string {
  if (typeof window === "undefined") {
    return raw;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
  const blocked = new Set(["script", "style", "noscript", "object", "embed", "form", "input", "button", "textarea"]);

  doc.querySelectorAll("*").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (blocked.has(tag)) {
      node.remove();
      return;
    }

    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        continue;
      }

      if (name === "href" || name === "src") {
        if (!isSafeUrl(value)) {
          node.removeAttribute(attr.name);
        }
      }
    }

    if (tag === "a") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer noopener");
    }

    if (tag === "iframe") {
      const src = node.getAttribute("src") ?? "";
      const allow = /youtube\.com|youtu\.be|vimeo\.com/i.test(src);
      if (!allow) {
        node.remove();
      } else {
        node.setAttribute("loading", "lazy");
        node.setAttribute("allowfullscreen", "true");
      }
    }
  });

  return doc.body.innerHTML;
}

function detectLanguage(className: string): string {
  const match = className.match(/language-([a-z0-9_-]+)/i);
  return match?.[1] ?? "code";
}

function splitTextWithWebinarShortcodes(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  WEBINAR_SHORTCODE_REGEX.lastIndex = 0;
  let match = WEBINAR_SHORTCODE_REGEX.exec(text);

  while (match) {
    const [full, slugRaw] = match;
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      segments.push({ type: "paragraph", text: before });
    }

    const slug = (slugRaw || "").trim().toLowerCase();
    if (slug) {
      segments.push({ type: "webinar", slug });
    }

    lastIndex = match.index + full.length;
    match = WEBINAR_SHORTCODE_REGEX.exec(text);
  }

  const tail = text.slice(lastIndex).trim();
  if (tail) {
    segments.push({ type: "paragraph", text: tail });
  }

  return segments.length ? segments : [{ type: "paragraph", text }];
}

function parseLegacy(content: string): Segment[] {
  const parts: Segment[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(content);

  while (match) {
    const [fullMatch, languageRaw, code] = match;
    const before = content.slice(lastIndex, match.index).trim();

    if (before) {
      before
        .split(/\n\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          parts.push(...splitTextWithWebinarShortcodes(item));
        });
    }

    parts.push({
      type: "code",
      language: languageRaw || "code",
      code: code.trim()
    });

    lastIndex = match.index + fullMatch.length;
    match = regex.exec(content);
  }

  const tail = content.slice(lastIndex).trim();
  if (tail) {
    tail
      .split(/\n\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        parts.push(...splitTextWithWebinarShortcodes(item));
      });
  }

  return parts;
}

function parseRichHtml(content: string): Segment[] {
  const clean = sanitizeHtml(content);
  if (typeof window === "undefined") {
    return [{ type: "html", html: clean }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, "text/html");
  const parts: Segment[] = [];

  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() ?? "";
      if (text) {
        parts.push(...splitTextWithWebinarShortcodes(text));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    if (element.tagName.toLowerCase() === "pre") {
      const codeElement = element.querySelector("code");
      const language = detectLanguage(codeElement?.className ?? "");
      const code = (codeElement?.textContent ?? element.textContent ?? "").trim();
      parts.push({ type: "code", language, code });
      return;
    }

    const elementText = (element.textContent ?? "").trim();
    const shortcodeMatch = elementText.match(/^\[webinar:([a-z0-9-]+)\]$/i);
    if (shortcodeMatch) {
      parts.push({ type: "webinar", slug: shortcodeMatch[1].toLowerCase() });
      return;
    }

    parts.push({ type: "html", html: element.outerHTML });
  });

  if (!parts.length && clean.trim()) {
    parts.push({ type: "html", html: clean });
  }

  return parts;
}

export function ArticleRenderer({ content }: { content: string }) {
  const segments = useMemo(
    () => (looksLikeHtml(content) ? parseRichHtml(content) : parseLegacy(content)),
    [content]
  );

  const webinarSlugs = useMemo(() => {
    const unique = new Set<string>();
    segments.forEach((item) => {
      if (item.type === "webinar") {
        unique.add(item.slug);
      }
    });
    return Array.from(unique);
  }, [segments]);

  const [webinarMap, setWebinarMap] = useState<Record<string, Webinar | null>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!webinarSlugs.length) {
      setWebinarMap({});
      return;
    }

    let cancelled = false;
    async function loadWebinars() {
      const entries = await Promise.all(
        webinarSlugs.map(async (slug) => {
          try {
            const webinar = await getWebinarBySlug(slug);
            return [slug, webinar] as const;
          } catch {
            return [slug, null] as const;
          }
        })
      );

      if (!cancelled) {
        setWebinarMap(Object.fromEntries(entries));
      }
    }

    void loadWebinars();
    return () => {
      cancelled = true;
    };
  }, [webinarSlugs]);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "paragraph") {
          return <p key={`p-${index}`}>{segment.text}</p>;
        }

        if (segment.type === "html") {
          return <div key={`h-${index}`} className="post-html" dangerouslySetInnerHTML={{ __html: segment.html }} />;
        }

        if (segment.type === "webinar") {
          const webinar = webinarMap[segment.slug];
          return (
            <article key={`w-${segment.slug}-${index}`} className="notice webinar-shortcode-card">
              <div className="label">Webinar</div>
              <h3 style={{ marginTop: "0.4rem" }}>
                {webinar?.title ?? `Webinar: ${segment.slug}`}
              </h3>
              {webinar ? <p className="meta">{new Date(webinar.startAt).toLocaleString()}</p> : null}
              <p className="muted">
                {webinar?.description ?? "Open webinar page and register for this session."}
              </p>
              <Link href={`/webinars/${segment.slug}`} className="btn btn-outline" style={{ marginTop: "0.7rem" }}>
                Open Webinar
              </Link>
            </article>
          );
        }

        return (
          <div className="code-block" key={`c-${index}`}>
            <div className="code-header">
              <span>{segment.language}</span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(segment.code);
                  setCopiedIndex(index);
                  window.setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 1200);
                }}
              >
                {copiedIndex === index ? "Copied" : "Copy"}
              </button>
            </div>
            <pre>
              <code>{segment.code}</code>
            </pre>
          </div>
        );
      })}
    </>
  );
}
