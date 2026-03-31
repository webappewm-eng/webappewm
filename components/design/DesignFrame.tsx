"use client";

import { buildDesignDocument } from "@/lib/design";

interface DesignFrameProps {
  html?: string;
  css?: string;
  js?: string;
  title: string;
  minHeight?: number;
}

export function DesignFrame({ html = "", css = "", js = "", title, minHeight = 540 }: DesignFrameProps) {
  const srcDoc = buildDesignDocument(html, css, js);

  return (
    <iframe
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: "100%", minHeight: `${minHeight}px`, border: "1px solid var(--border)", borderRadius: "10px", background: "#fff" }}
    />
  );
}

