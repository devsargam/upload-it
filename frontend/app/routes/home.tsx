import type { Route } from "./+types/home";
import { Welcome, BACKGROUND_URL } from "../welcome/welcome";

export const links: Route.LinksFunction = () => [
  { rel: "preload", as: "image", href: BACKGROUND_URL, type: "image/webp" },
];

export function meta({}: Route.MetaArgs) {
  const title = "Upload It | Share files instantly from your terminal";
  const description =
    "Upload files in one command, get a shareable link instantly, and keep your workflow inside the terminal with Upload It.";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: "/og-image.png" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: "/og-image.png" },
  ];
}

export default function Home() {
  return <Welcome />;
}
