import type { Metadata } from "next";

import { CommunityEntry } from "./community-entry";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PREVIEW_COOKIE } from "@/lib/community-entry";

export const metadata: Metadata = {
  title: "L’énigme d’entrée à la communauté",
  description: "Résous l’énigme pour rejoindre AfroCodeurs, ou découvre librement la communauté comme simple visiteur.",
  robots: { index: false, follow: false },
};

export default async function ConstructionPage() {
  if ((await auth())?.user) redirect("/");
  if ((await cookies()).get(PREVIEW_COOKIE)?.value === "open") redirect("/register");
  return <CommunityEntry />;
}
