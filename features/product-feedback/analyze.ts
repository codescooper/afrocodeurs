import type { FeedbackCategory } from "@prisma/client";

const RULES: Array<{ category: FeedbackCategory; words: string[] }> = [
  { category: "BUG", words: ["bug", "erreur", "bloqué", "impossible", "ne marche", "plantage", "cassé"] },
  { category: "PERFORMANCE", words: ["lent", "lenteur", "performance", "chargement", "timeout"] },
  { category: "UX", words: ["confus", "comprendre", "navigation", "bouton", "interface", "mobile"] },
  { category: "CONTENT", words: ["article", "ressource", "cours", "contenu", "formation"] },
  { category: "MISSING_FEATURE", words: ["ajouter", "manque", "faudrait", "besoin", "fonctionnalité", "intégrer"] },
];

export function analyzeFeedback(title: string, description: string) {
  const text = `${title} ${description}`.toLocaleLowerCase("fr");
  const matched = RULES.map((rule) => ({ ...rule, hits: rule.words.filter((word) => text.includes(word)) }))
    .filter((rule) => rule.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);
  const category = matched[0]?.category ?? "OTHER";
  const urgency = ["urgent", "bloqué", "impossible", "sécurité", "perte"].filter((word) => text.includes(word)).length;
  const communityImpact = ["tous", "membres", "utilisateurs", "communauté", "publication"].filter((word) => text.includes(word)).length;
  const priorityScore = Math.min(5, Math.max(1, 1 + urgency + Math.min(2, communityImpact)));
  const signals = matched[0]?.hits.join(", ") || "aucun signal fort";
  return { category, priorityScore, analysis: `Catégorie suggérée : ${category}. Priorité ${priorityScore}/5. Signaux détectés : ${signals}. Validation humaine requise.` };
}
