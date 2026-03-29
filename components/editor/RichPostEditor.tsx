"use client";

import { useEffect, useRef, useState } from "react";

interface RichPostEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toEditorHtml(content: string): string {
  const normalized = content.trim();
  if (!normalized) {
    return "<p></p>";
  }

  if (looksLikeHtml(normalized)) {
    return normalized;
  }

  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = codeRegex.exec(normalized);

  while (match) {
    const [full, langRaw, code] = match;
    const before = normalized.slice(lastIndex, match.index).trim();
    if (before) {
      before
        .split(/\n\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          parts.push(`<p>${escapeHtml(item).replace(/\n/g, "<br />")}</p>`);
        });
    }

    const language = (langRaw || "code").trim();
    parts.push(
      `<pre><code class=\"language-${escapeHtml(language)}\">${escapeHtml(code.trim())}</code></pre>`
    );

    lastIndex = match.index + full.length;
    match = codeRegex.exec(normalized);
  }

  const tail = normalized.slice(lastIndex).trim();
  if (tail) {
    tail
      .split(/\n\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        parts.push(`<p>${escapeHtml(item).replace(/\n/g, "<br />")}</p>`);
      });
  }

  return parts.join("\n") || "<p></p>";
}

function youtubeEmbedUrl(url: string): string {
  const value = url.trim();
  const watchMatch = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  if (!watchMatch) {
    return "";
  }
  return `https://www.youtube.com/embed/${watchMatch[1]}`;
}

export function RichPostEditor({ value, onChange }: RichPostEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const focusedRef = useRef(false);
  const [sourceMode, setSourceMode] = useState(false);

  useEffect(() => {
    if (sourceMode) {
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextHtml = toEditorHtml(value);
    if (!focusedRef.current || editor.innerHTML.trim() === "") {
      if (editor.innerHTML !== nextHtml) {
        editor.innerHTML = nextHtml;
      }
    }
  }, [sourceMode, value]);

  function emitChange() {
    const html = editorRef.current?.innerHTML ?? "";
    onChange(html);
  }

  function runCommand(command: string, commandValue?: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function insertHtml(html: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand("insertHTML", false, html);
    emitChange();
  }

  function wrapSelectionWithCodeBlock() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const text = selection.toString();
    if (!text.trim()) {
      return;
    }

    const range = selection.getRangeAt(0);
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "language-code";
    code.textContent = text;
    pre.appendChild(code);

    range.deleteContents();
    range.insertNode(pre);
    range.setStartAfter(pre);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    emitChange();
  }

  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <button type="button" onClick={() => runCommand("bold")}>Bold</button>
        <button type="button" onClick={() => runCommand("italic")}>Italic</button>
        <button type="button" onClick={() => runCommand("underline")}>Underline</button>
        <button type="button" onClick={() => runCommand("formatBlock", "<h2>")}>H2</button>
        <button type="button" onClick={() => runCommand("formatBlock", "<h3>")}>H3</button>
        <button type="button" onClick={() => runCommand("insertUnorderedList")}>List</button>
        <button type="button" onClick={() => runCommand("formatBlock", "<blockquote>")}>Quote</button>
        <button
          type="button"
          onClick={() => {
            const href = window.prompt("Enter link URL");
            if (!href) {
              return;
            }
            runCommand("createLink", href.trim());
          }}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => {
            const src = window.prompt("Image URL");
            if (!src) {
              return;
            }
            insertHtml(`<p><img src=\"${src.trim()}\" alt=\"image\" /></p>`);
          }}
        >
          Image
        </button>
        <button
          type="button"
          onClick={() => {
            const src = window.prompt("Video URL (YouTube link or direct .mp4 URL)");
            if (!src) {
              return;
            }

            const yt = youtubeEmbedUrl(src);
            if (yt) {
              insertHtml(`<div class=\"post-embed\"><iframe src=\"${yt}\" title=\"Embedded video\" loading=\"lazy\" allowfullscreen></iframe></div>`);
              return;
            }

            insertHtml(`<p><video controls preload=\"metadata\" src=\"${src.trim()}\"></video></p>`);
          }}
        >
          Video
        </button>
        <button type="button" onClick={wrapSelectionWithCodeBlock}>Code Block</button>
        <button
          type="button"
          className={sourceMode ? "active" : ""}
          onClick={() => setSourceMode((prev) => !prev)}
        >
          {sourceMode ? "Visual" : "HTML"}
        </button>
      </div>

      {sourceMode ? (
        <textarea
          rows={12}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write HTML content"
        />
      ) : (
        <div
          ref={editorRef}
          className="editor-surface"
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            emitChange();
          }}
          onInput={emitChange}
        />
      )}

      <p className="editor-note">
        Tip: select any text and click <strong>Code Block</strong> to make copy-ready code snippets.
      </p>
    </div>
  );
}
