import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thread — One health story",
    short_name: "Thread",
    description: "Evidence-backed longitudinal context for chronic care.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ef",
    theme_color: "#462b39",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
