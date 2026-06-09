/**
 * Configuration Markdown partagée (Markdown First, cf. SDD §39).
 * Le rendu se fait côté serveur via <Markdown> (components/shared/markdown.tsx)
 * avec remark-gfm + rehype-sanitize pour la protection XSS.
 */

/** Estime le temps de lecture en minutes (~200 mots/min). */
export function readingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Extrait un résumé en clair depuis du Markdown (pour les cartes/SEO). */
export function excerpt(markdown: string, maxLength = 160): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
