import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Engineer With Me",
    short_name: "EWM",
    description: "Engineering blog with guided learning tracks",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff6b00",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
