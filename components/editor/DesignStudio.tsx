"use client";

import JSZip from "jszip";
import { ChangeEvent, useMemo, useState } from "react";
import { buildDesignDocument } from "@/lib/design";

interface DesignStudioProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  onHtmlCodeChange: (value: string) => void;
  onCssCodeChange: (value: string) => void;
  onJsCodeChange: (value: string) => void;
  title?: string;
}

async function fileToText(file: File): Promise<string> {
  return file.text();
}

function splitByExtension(name: string): "html" | "css" | "js" | "other" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "html";
  }
  if (lower.endsWith(".css")) {
    return "css";
  }
  if (lower.endsWith(".js")) {
    return "js";
  }
  return "other";
}

export function DesignStudio({
  htmlCode,
  cssCode,
  jsCode,
  onHtmlCodeChange,
  onCssCodeChange,
  onJsCodeChange,
  title = "Design Builder"
}: DesignStudioProps) {
  const [status, setStatus] = useState("");

  const previewDoc = useMemo(() => buildDesignDocument(htmlCode, cssCode, jsCode), [htmlCode, cssCode, jsCode]);

  async function handleSingleFile(type: "html" | "css" | "js", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await fileToText(file);
    if (type === "html") {
      onHtmlCodeChange(text);
    }
    if (type === "css") {
      onCssCodeChange(text);
    }
    if (type === "js") {
      onJsCodeChange(text);
    }
    setStatus(`${type.toUpperCase()} file imported.`);
    event.target.value = "";
  }

  async function handleZipImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      let nextHtml = "";
      let nextCss = "";
      let nextJs = "";

      const entries = Object.keys(zip.files)
        .map((name) => zip.files[name])
        .filter((entry) => !entry.dir);

      for (const entry of entries) {
        const ext = splitByExtension(entry.name);
        if (ext === "other") {
          continue;
        }
        const text = await entry.async("text");
        if (ext === "html" && !nextHtml) {
          nextHtml = text;
        }
        if (ext === "css" && !nextCss) {
          nextCss = text;
        }
        if (ext === "js" && !nextJs) {
          nextJs = text;
        }
      }

      if (nextHtml) {
        onHtmlCodeChange(nextHtml);
      }
      if (nextCss) {
        onCssCodeChange(nextCss);
      }
      if (nextJs) {
        onJsCodeChange(nextJs);
      }

      setStatus("ZIP imported. HTML/CSS/JS applied where found.");
    } catch {
      setStatus("ZIP import failed. Please upload a valid ZIP with html/css/js files.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleFolderImport(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    let nextHtml = "";
    let nextCss = "";
    let nextJs = "";

    for (const file of files) {
      const ext = splitByExtension(file.name);
      if (ext === "other") {
        continue;
      }

      const text = await fileToText(file);
      if (ext === "html" && !nextHtml) {
        nextHtml = text;
      }
      if (ext === "css" && !nextCss) {
        nextCss = text;
      }
      if (ext === "js" && !nextJs) {
        nextJs = text;
      }
    }

    if (nextHtml) {
      onHtmlCodeChange(nextHtml);
    }
    if (nextCss) {
      onCssCodeChange(nextCss);
    }
    if (nextJs) {
      onJsCodeChange(nextJs);
    }

    setStatus("Folder import completed.");
    event.target.value = "";
  }

  const folderInputProps = {
    webkitdirectory: "true",
    directory: "true"
  } as unknown as Record<string, string>;

  return (
    <div className="design-studio">
      <div className="label">{title}</div>
      <div className="form-grid" style={{ marginTop: "0.7rem" }}>
        <div className="form-actions">
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            Import HTML File
            <input type="file" accept=".html,.htm,text/html" onChange={(event) => void handleSingleFile("html", event)} hidden />
          </label>
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            Import CSS File
            <input type="file" accept=".css,text/css" onChange={(event) => void handleSingleFile("css", event)} hidden />
          </label>
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            Import JS File
            <input type="file" accept=".js,text/javascript" onChange={(event) => void handleSingleFile("js", event)} hidden />
          </label>
        </div>

        <div className="form-actions">
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            Import ZIP
            <input type="file" accept=".zip,application/zip" onChange={(event) => void handleZipImport(event)} hidden />
          </label>
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            Import Folder
            <input type="file" multiple {...folderInputProps} onChange={(event) => void handleFolderImport(event)} hidden />
          </label>
        </div>

        <textarea rows={7} placeholder="Direct HTML code" value={htmlCode} onChange={(event) => onHtmlCodeChange(event.target.value)} />
        <textarea rows={6} placeholder="Direct CSS code" value={cssCode} onChange={(event) => onCssCodeChange(event.target.value)} />
        <textarea rows={6} placeholder="Direct JS code" value={jsCode} onChange={(event) => onJsCodeChange(event.target.value)} />

        <div className="notice">
          <strong>Live Preview</strong>
          <iframe
            title={`${title} preview`}
            srcDoc={previewDoc}
            sandbox="allow-scripts allow-same-origin"
            style={{ width: "100%", minHeight: "340px", border: "1px solid var(--border)", marginTop: "0.6rem", borderRadius: "8px", background: "#fff" }}
          />
        </div>

        {status ? <div className="notice">{status}</div> : null}
      </div>
    </div>
  );
}
