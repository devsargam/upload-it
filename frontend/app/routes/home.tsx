import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upload It" },
    { name: "description", content: "Upload files from the terminal with Upload It." },
  ];
}

export default function Home() {
  return <Welcome />;
}
