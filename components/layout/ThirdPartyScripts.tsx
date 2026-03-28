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
          if (document.querySelector(`script[data-ewm-id=\"${marker}\"]`)) {
            return;
          }

          const script = document.createElement("script");
          script.src = item.src;
          script.async = true;
          script.dataset.ewmId = marker;
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
