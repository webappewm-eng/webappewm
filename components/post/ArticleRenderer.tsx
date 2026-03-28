"use client";

import { useMemo, useState } from "react";

type Segment =
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; code: string };

function parseContent(content: string): Segment[] {
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

export function ArticleRenderer({ content }: { content: string }) {
  const segments = useMemo(() => parseContent(content), [content]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "paragraph") {
          return <p key={`p-${index}`}>{segment.text}</p>;
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
