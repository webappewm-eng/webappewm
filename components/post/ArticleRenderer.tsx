"use client";

import { useMemo, useState } from "react";

type Segment =
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "html"; html: string };

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
        .forEach((item) => parts.push({ type: "paragraph", text: item }));
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
      .forEach((item) => parts.push({ type: "paragraph", text: item }));
  }

  return parts;
}

function detectLanguage(className: string): string {
  const match = className.match(/language-([a-z0-9_-]+)/i);
  return match?.[1] ?? "code";
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
        parts.push({ type: "paragraph", text });
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "paragraph") {
          return <p key={`p-${index}`}>{segment.text}</p>;
        }

        if (segment.type === "html") {
          return <div key={`h-${index}`} className="post-html" dangerouslySetInnerHTML={{ __html: segment.html }} />;
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
