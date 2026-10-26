import type { Metadata } from "next";

import { ConstructionGate } from "./construction-gate";

export const metadata: Metadata = {
  title: "L’énigme d’entrée à la communauté",
  description: "Résous l’énigme AfroCodeurs pour accéder au formulaire d’inscription. Les autres pages du site restent accessibles librement.",
  robots: { index: false, follow: false },
};

export default function ConstructionPage() {
  return <ConstructionGate />;
}
