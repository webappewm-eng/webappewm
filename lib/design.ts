export function buildDesignDocument(html: string, css: string, js: string): string {
  const safeHtml = html || "";
  const safeCss = css || "";
  const safeJs = (js || "").replace(/<\/script>/gi, "<\\/script>");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${safeCss}</style>
</head>
<body>
${safeHtml}
<script>${safeJs}<\/script>
</body>
</html>`;
}
