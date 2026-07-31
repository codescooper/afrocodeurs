import type { Metadata } from "next";

import { ConstructionGate } from "./construction-gate";

export const metadata: Metadata = {
  title: "AfroCodeurs prépare quelque chose",
  description: "La communauté AfroCodeurs arrive bientôt.",
  robots: { index: false, follow: false },
};

export default function ConstructionPage() {
  return <ConstructionGate />;
}
