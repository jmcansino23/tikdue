import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tikdue",
    short_name: "Tikdue",
    description: "Tick every due. Bills and document expiries, here and back home.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: "#063B37",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
