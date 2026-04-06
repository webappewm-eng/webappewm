"use client";

import { useEffect, useRef, useState } from "react";
import { buildDesignDocument } from "@/lib/design";

interface DesignFrameProps {
  html?: string;
  css?: string;
  js?: string;
  title: string;
  minHeight?: number;
  borderless?: boolean;
  fitContent?: boolean;
}

export function DesignFrame({ html = "", css = "", js = "", title, minHeight = 540, borderless = false, fitContent = false }: DesignFrameProps) {
  const srcDoc = buildDesignDocument(html, css, js);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [frameHeight, setFrameHeight] = useState(minHeight);

  useEffect(() => {
    setFrameHeight(minHeight);
  }, [minHeight, srcDoc]);

  useEffect(() => {
    if (!fitContent) {
      return;
    }

    const frame = iframeRef.current;
    if (!frame) {
      return;
    }

    let observer: ResizeObserver | null = null;
    let rafId = 0;

    const updateHeight = () => {
      const doc = frame.contentDocument;
      if (!doc) {
        return;
      }

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      rafId = window.requestAnimationFrame(() => {
        const bodyHeight = doc.body?.scrollHeight ?? 0;
        const htmlHeight = doc.documentElement?.scrollHeight ?? 0;
        const nextHeight = Math.max(minHeight, bodyHeight, htmlHeight);
        setFrameHeight(nextHeight);
      });
    };

    const onLoad = () => {
      updateHeight();

      if (typeof ResizeObserver !== "undefined") {
        observer?.disconnect();
        observer = new ResizeObserver(updateHeight);
        if (frame.contentDocument?.body) {
          observer.observe(frame.contentDocument.body);
        }
        if (frame.contentDocument?.documentElement) {
          observer.observe(frame.contentDocument.documentElement);
        }
      }
    };

    frame.addEventListener("load", onLoad);
    if (frame.contentDocument?.readyState === "complete") {
      onLoad();
    }

    return () => {
      frame.removeEventListener("load", onLoad);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
    };
  }, [fitContent, minHeight, srcDoc]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin"
      scrolling={fitContent ? "no" : "auto"}
      style={{
        width: "100%",
        minHeight: `${minHeight}px`,
        height: fitContent ? `${frameHeight}px` : undefined,
        border: borderless ? "0" : "1px solid var(--border)",
        borderRadius: borderless ? "0" : "10px",
        background: "#fff",
        display: "block"
      }}
    />
  );
}
