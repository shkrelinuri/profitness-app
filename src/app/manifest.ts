import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lotus Fitness Gym",
    short_name: "Lotus Gym",
    description: "Find Lotus Gym in central Tirana, Albania.",
    start_url: "/",
    display: "standalone",
    background_color: "#100b0d",
    theme_color: "#100b0d",
    icons: [
      {
        src: "/lotuslogo.png",
        sizes: "150x150",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
