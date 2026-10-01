# AfroCodeurs Brand Hub — Guide de production

> **Source de vérité opérationnelle** pour toute création AfroCodeurs.
>
> À joindre ou lier dans chaque brief adressé à un graphiste, motion designer, développeur, monteur, photographe, community manager ou partenaire.

## 1. Règle d'or

Une création AfroCodeurs n'est pas validée parce qu'elle est “belle”. Elle est validée si elle est :

**reconnaissable + lisible + cohérente + accessible + réutilisable + correctement livrée.**

Référence mère : [BRAND-GUIDELINES.md](./BRAND-GUIDELINES.md)

---

## 2. Avant toute création — Brand Brief obligatoire

Copier cette fiche dans la tâche, issue ou message de production.

```text
AFROCODEURS — BRAND BRIEF

Projet / campagne :
Programme : AfroCodeurs / Webinar / Live / Workshop / Talk / Challenge / Open Source / Campus
Objectif :
Audience :
Message principal :
CTA :
Canal(x) :
Format(s) :
Date de publication :
Langue(s) :
Contenus obligatoires :
Assets fournis :
Contraintes :
Livrables attendus :
Responsable validation :

Référence de marque :
docs/brand/BRAND-GUIDELINES.md

Déclinaison éventuelle :
docs/brand/[PROGRAMME].md
```

Aucun prestataire ne devrait avoir à deviner le format, le message principal, la hiérarchie ou les fichiers attendus.

---

## 3. Ce qui est verrouillé / ce qui est flexible

### VERROUILLÉ — ne pas réinterpréter

- nom **AfroCodeurs** ;
- palette cœur ;
- règles du logo ;
- hiérarchie de marque ;
- typographies de référence ;
- lisibilité/accessibilité ;
- philosophie **Signal + Structure + Humain** ;
- nomenclature des programmes ;
- formats et safe areas validés ;
- fichiers sources et règles d'export.

### FLEXIBLE — espace créatif

- composition dans la grille ;
- photographie ;
- illustration ;
- rythme ;
- cadrage ;
- animation ;
- motifs secondaires ;
- storytelling ;
- transitions ;
- traitement éditorial spécifique au sujet.

**Cohérence ne signifie pas répétition.**

---

# 4. Guide GRAPHISTE

## Entrées minimales

Le graphiste reçoit :

- Brand Brief ;
- charte ;
- logo officiel ;
- photos/portraits validés ;
- textes définitifs ;
- dimensions ;
- références de la déclinaison concernée.

## Priorité visuelle

Dans l'ordre :

1. message principal ;
2. marque / programme ;
3. personne ou sujet ;
4. information pratique ;
5. CTA ;
6. détails secondaires / partenaires.

## Fichiers de travail

Préférer :

- Figma pour systèmes et composants ;
- Illustrator/SVG pour vecteurs ;
- Photoshop uniquement lorsque le traitement bitmap l'exige ;
- Canva pour déclinaisons éditables destinées à l'équipe communication.

## Livrables

Pour chaque master :

- source éditable ;
- PDF de contrôle si pertinent ;
- SVG pour vecteurs ;
- PNG haute définition ;
- JPG/WebP optimisé si nécessaire ;
- variantes canal demandées.

Ne jamais livrer uniquement un JPG aplati lorsqu'un fichier source est attendu.

---

# 5. Guide MOTION DESIGNER

## Principe

Le mouvement doit renforcer **construction, connexion et progression**.

### Comportements recommandés

- reveal par blocs/grille ;
- lignes qui se connectent ;
- nœuds qui apparaissent ;
- titres francs ;
- transitions courtes ;
- compteur / curseur / code comme micro-langage ;
- mouvements directionnels Problem → Solution.

### À éviter

- glitch permanent ;
- pluie de code cliché ;
- zooms agressifs ;
- néons cyberpunk non justifiés ;
- transitions différentes à chaque plan ;
- animation du logo qui le déforme.

## Timing indicatif

- micro-interaction : 150–300 ms ;
- transition UI/graphique : 250–600 ms ;
- title reveal : 400–900 ms ;
- outro logo : 1,5–3 s.

## Kit motion attendu

À terme, chaque production vidéo doit pouvoir réutiliser :

- logo sting ;
- intro courte ;
- outro ;
- lower third intervenant ;
- title card ;
- chapter card ;
- transition ;
- LIVE bug ;
- CTA ;
- end screen ;
- sous-titres.

## Livraisons

- master haute qualité ;
- version réseaux sociaux ;
- version transparente si overlay ;
- fichier source ;
- polices/références documentées, jamais incorporées illégalement ;
- durée, FPS, résolution et codec indiqués.

### Formats usuels

| Usage | Format |
|---|---|
| YouTube / webinar | 1920×1080, 16:9 |
| Vertical | 1080×1920, 9:16 |
| Social portrait | 1080×1350, 4:5 |
| Square | 1080×1080, 1:1 |

Sous-titres et zones sûres sont obligatoires pour les contenus sociaux.

---

# 6. Guide DÉVELOPPEUR

## Source de vérité

Les valeurs de marque ne doivent pas être recopiées arbitrairement dans les composants.

Utiliser :

- `docs/brand/tokens.json` pour la définition canonique ;
- les CSS custom properties / tokens Tailwind du projet ;
- les composants UI partagés.

## Règles

- aucun nouveau jaune “presque AfroCodeurs” ;
- aucun hex propriétaire répété sans raison ;
- WCAG AA minimum ;
- responsive dès la conception ;
- dark/light compatibles lorsque le composant le requiert ;
- états hover/focus/disabled explicites ;
- respecter `prefers-reduced-motion` ;
- utiliser SVG pour les marques/icônes vectorielles ;
- alt text approprié ;
- ne jamais convertir un texte essentiel en image.

## Nouveau composant de marque

Avant de créer :

1. vérifier qu'il n'existe pas ;
2. identifier le token ;
3. identifier le pattern ;
4. construire le composant ;
5. tester responsive ;
6. tester clavier/focus ;
7. tester light/dark si pertinent ;
8. documenter l'usage.

---

# 7. Guide SOCIAL / COMMUNITY

Une déclinaison sociale n'est pas un redimensionnement automatique.

Pour chaque canal vérifier :

- zone visible sans ouvrir l'image ;
- longueur du titre ;
- CTA ;
- ratio ;
- sous-titres ;
- miniature ;
- lisibilité mobile.

### Minimum campagne événementielle

- master 4:5 ;
- story 9:16 ;
- landscape 16:9 ;
- thumbnail/replay ;
- texte de publication ;
- alt text.

---

# 8. Guide PARTENARIATS / CO-BRANDING

AfroCodeurs conserve son identité même avec un partenaire.

### Règles

- ne pas fusionner les logos ;
- ne pas recolorer le logo AfroCodeurs avec la palette partenaire ;
- conserver les zones de protection ;
- distinguer clairement organisateur / partenaire / sponsor ;
- utiliser une zone partenaires dédiée.

Si un partenaire impose sa propre charte, produire un compromis documenté plutôt qu'une identité hybride improvisée.

---

# 9. Spécifications d'export

## Images

### Web
- WebP ou AVIF lorsque supporté ;
- PNG si transparence nécessaire ;
- JPG pour photographie si plus pertinent ;
- éviter les fichiers surdimensionnés.

### Réseaux
Exporter à la dimension finale prévue. Ne pas compter sur la plateforme pour corriger un mauvais ratio.

## Vecteurs

- SVG optimisé pour web ;
- PDF vectoriel pour validation/impression ;
- conserver un master éditable.

## Impression

- PDF print-ready ;
- fonds perdus selon imprimeur ;
- CMJN selon workflow imprimeur ;
- images 300 ppp à taille réelle ;
- BAT avant production importante.

---

# 10. Nommage des fichiers

Format :

```
AC_[programme]_[campagne]_[asset]_[format]_[lang]_[version].[ext]
```

Exemples :

```
AC_WEBINAR_ARTCI_announcement_1080x1350_FR_v03.png
AC_WEBINAR_ARTCI_story_1080x1920_FR_v03.png
AC_WEBINAR_ARTCI_replay_1280x720_FR_v02.webp
AC_BRAND_logo-horizontal_dark_v01.svg
```

Éviter :

```
final.png
final2.png
final_vrai.png
final_corrige_definitif.png
```

---

# 11. Versioning

Chaque asset validé possède :

- un nom stable ;
- une version ;
- une date ;
- un propriétaire ;
- un statut.

### Statuts

`DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED`

Une correction après publication crée une nouvelle version.

---

# 12. Structure recommandée des assets

```text
brand/
  guidelines/
  logos/
    master/
    exports/
  typography/
  patterns/
  icons/
  templates/
    social/
    webinars/
    presentations/
  motion/
    logo-sting/
    lower-thirds/
    transitions/
    outros/
  campaigns/
  archive/
```

---

# 13. Validation — Brand QA

Avant validation finale, répondre OUI à tous les points applicables.

## Marque

- [ ] AfroCodeurs est identifiable.
- [ ] Le bon logo est utilisé.
- [ ] La zone de protection est respectée.
- [ ] Les couleurs sont conformes.
- [ ] La sous-marque ne domine pas AfroCodeurs.

## Message

- [ ] Un message principal est identifiable.
- [ ] La hiérarchie est claire.
- [ ] Les informations sont exactes.
- [ ] Le CTA est explicite.

## Visuel

- [ ] Lisible sur mobile.
- [ ] Pas de cliché visuel contraire à la charte.
- [ ] Les portraits sont fidèles et autorisés.
- [ ] Les partenaires sont correctement positionnés.

## Accessibilité

- [ ] Contraste suffisant.
- [ ] L'information ne dépend pas uniquement d'une couleur.
- [ ] Alt text prévu si nécessaire.
- [ ] Sous-titres prévus pour la vidéo.
- [ ] Reduced motion géré côté produit si pertinent.

## Production

- [ ] Dimensions correctes.
- [ ] Nommage correct.
- [ ] Source éditable conservée.
- [ ] Exports nécessaires présents.
- [ ] Version renseignée.
- [ ] Responsable de validation identifié.

---

# 14. Definition of Done

Une création AfroCodeurs est **DONE** uniquement lorsque :

1. le brief est respecté ;
2. la Brand QA est passée ;
3. le décideur désigné a validé ;
4. les sources sont archivées ;
5. les exports sont disponibles ;
6. les fichiers sont correctement nommés ;
7. la création peut être reprise par une autre personne sans dépendre de son auteur.

---

# 15. Fiche de passation

À remettre avec tout projet terminé :

```text
AFROCODEURS — HANDOFF

Projet :
Asset :
Version :
Statut :
Créé par :
Validé par :
Date :

Sources :
Exports :
Fonts :
Photos / licences :
Liens :
Composants / tokens :
Déclinaison de marque utilisée :

Modifications autorisées :
Éléments verrouillés :
Notes pour le prochain intervenant :
```

---

# 16. Principe de continuité

**Une création n'est pas un fichier isolé : elle enrichit le système.**

Si une solution visuelle ou technique nouvelle est validée et destinée à être répétée, elle doit devenir :

- un token ;
- un composant ;
- un template ;
- un pattern ;
- ou une règle documentée.

C'est ainsi qu'AfroCodeurs reste cohérent même lorsque les personnes, prestataires et outils changent.
