"use client";

import { useEffect } from "react";
import { getThirdPartyScripts } from "@/lib/firebase/data";

export function ThirdPartyScripts() {
  useEffect(() => {
    let mounted = true;

    async function loadScripts() {
      const scripts = await getThirdPartyScripts();
      if (!mounted) {
        return;
      }

      scripts
        .filter((item) => item.enabled)
        .forEach((item) => {
          const marker = `ewm-script-${item.id}`;
          if (document.querySelector(`script[data-ewm-id="${marker}"]`)) {
            return;
          }

          const src = item.src.trim();
          const inlineCode = item.inlineCode.trim();
          if (!src && !inlineCode) {
            return;
          }

          const script = document.createElement("script");
          script.dataset.ewmId = marker;

          if (src) {
            script.src = src;
            script.async = true;
          } else {
            script.textContent = inlineCode;
          }

          const target = item.location === "head" ? document.head : document.body;
          target.appendChild(script);
        });
    }

    void loadScripts();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
