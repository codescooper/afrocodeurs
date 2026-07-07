# Templates

Squelettes de mise en page (grille, colonnes, zones) qui reçoivent des
organismes en slots — aucune donnée, aucune logique métier, juste de la
disposition responsive.

Exemples attendus : `TwoColumnTemplate` (contenu + sidebar).

- `hub-template.tsx` — en-tête (titre, description, action) + grille de
  contenu + rail optionnel à droite (`lg:grid-cols-[1fr_320px]`). Utilisé par
  `/explorer`. À appliquer ensuite à `/knowledge`, `/atlas`, `/communities`,
  `/forum` (même disposition, cf. `.claude/skills/atomic-components`).
