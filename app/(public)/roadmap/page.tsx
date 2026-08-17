import { redirect } from "next/navigation";

export const metadata = { title: "Feuille de route" };

export default function RoadmapPage() {
  redirect("/updates#roadmap");
}
