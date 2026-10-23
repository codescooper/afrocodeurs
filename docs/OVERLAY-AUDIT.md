# Audit des surfaces superposees - 23 octobre 2026

## Cause confirmee

Sur la recherche des membres en production, `getComputedStyle` retourne `rgba(0, 0, 0, 0)` pour `.bg-popover`. Les classes `bg-popover` et `text-popover-foreground` etaient utilisees sans les tokens Tailwind correspondants. Augmenter le z-index ou ajouter une ombre ne corrige pas cette transparence.

Les tokens globaux `popover` et `popover-foreground` pointent maintenant vers les couleurs opaques des cartes. Ils suivent les themes clair, sombre manuel et sombre systeme. Les utilitaires Tailwind sont donc generes pour tous leurs consommateurs, sans correctifs locaux en blanc force.

## Inventaire des composants et usages

| Surface | Interfaces concernees | Constat |
| --- | --- | --- |
| Recherche de membres | Nouvelle conversation | Token absent, donc fond transparent ; corrige globalement. Texte explicite et hauteur deroulante bornee ajoutes. |
| Dropdown principal | Menu utilisateur, menu Plus de la navigation mobile | Meme token absent ; correction globale. |
| Sous-menu dropdown | `DropdownMenuSubContent`, disponible pour tous les futurs menus | Meme token absent ; correction globale. |
| Dialogues | Liste des membres, gestion des contenus, formulaire de retour produit, fiche Constellation | Fond `bg-background` deja defini et opaque ; pas de remplacement inutile. |
| Infobulles | Avatars et composants Tooltip | Fond `bg-foreground` deja defini et opaque. |
| Notifications | Panneau de la cloche | Fond `bg-background` deja defini et opaque. |
| Messagerie compacte | Fenetres du dock | Fond `bg-background` deja defini et opaque. |
| Voile modal | `DialogOverlay` | Noir a 50 % intentionnel : le voile reste translucide, pas le contenu du dialogue. |
| Barres fixes et consentement | En-tetes, navigation mobile, bandeau cookies | Fond a 95 % et flou intentionnels ; distincts d'une surface sans fond. |

## Verification et limites

Tests de regression : palettes claire/sombre opaques, couleur de texte distincte, presence effective des utilitaires dans le CSS compile par Tailwind. La recherche ne doit plus laisser apparaitre le champ du groupe ou le bouton a travers les resultats.

Cet inventaire couvre les surfaces identifiees dans le code du repo ; il ne garantit pas chaque combinaison de contenu et d'etat en production. Verifier apres deploiement les menus utilisateur/mobile et la recherche de membres, en themes clair et sombre, puis les dialogues et le dock. Ne pas appliquer `opacity: 1 !important` globalement : cela casserait les voiles et les animations intentionnelles.

Recette locale reproductible : `node scripts/preview-overlays.mjs` ouvre un banc de surfaces a `http://127.0.0.1:3034`, avec le CSS global reel compile par Tailwind et sans acces a la base. Sept familles controlees dans Chrome en clair et sombre : fonds RGB opaques ; viewport mobile 390 px sans debordement horizontal. Ce banc valide les styles partages, pas les parcours metier de chaque ecran.
