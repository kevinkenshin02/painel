import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel Tanaka — Ótica e Relojoaria",
    short_name: "Painel Tanaka",
    description: "Painel de gestão da Tanaka Ótica e Relojoaria",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0c0b",
    theme_color: "#f9b233",
    lang: "pt-BR",
    icons: [
      { src: "/icones/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icones/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
