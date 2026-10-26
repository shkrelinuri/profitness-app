import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProFitness Training Club",
    short_name: "ProFitness",
    description: "A welcoming place to move, build strength, and find your rhythm.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4ef",
    theme_color: "#f5f4ef",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
