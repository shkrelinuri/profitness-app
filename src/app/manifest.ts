import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lotus Fitness Gym",
    short_name: "Lotus Gym",
    description: "Find Lotus Gym in central Tirana, Albania.",
    start_url: "/",
    display: "standalone",
    background_color: "#111310",
    theme_color: "#111310",
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
