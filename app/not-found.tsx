import { ThemedNotFound } from "@/components/layout/ThemedNotFound";
import { getSiteSettings } from "@/lib/firebase/data";

function sanitizeLabel(value: string): string {
  const label = value.trim();
  return label || "Go to Home";
}

export default async function NotFoundPage() {
  try {
    const settings = await getSiteSettings();
    const redirectHref = settings.notFoundRedirectType === "custom" ? settings.notFoundRedirectPath : "/";
    return <ThemedNotFound redirectHref={redirectHref} buttonLabel={sanitizeLabel(settings.notFoundButtonLabel)} />;
  } catch {
    return <ThemedNotFound redirectHref="/" buttonLabel="Go to Home" />;
  }
}
