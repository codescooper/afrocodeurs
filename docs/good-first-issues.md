# 🌱 Idées pour démarrer

Tu cherches ta première contribution ? Pioche ici. Chaque idée indique sa
**difficulté** et par où commencer. Commente l'issue correspondante (ou ouvre-en
une) avec « je prends » avant de te lancer, pour éviter le travail en double.

> 💛 Rappel : même une correction de typo est une vraie contribution. Commence petit.

## 💻 Côté code

### 🟢 Facile
- **Mettre en place Prettier.** Aujourd'hui `./run format` répond « aucun
  formateur ». Ajoute `prettier`, un `.prettierrc`, un script `format` au
  `package.json` → `./run format` et `--fix` fonctionneront pour tout le monde.
- **Premiers tests.** Il n'y a pas encore de tests. Mets en place
  [Vitest](https://vitest.dev) et écris-en un pour une fonction pure :
  `slugify` ([lib/utils.ts](../lib/utils.ts)) ou `excerpt` / `readingTimeMinutes`
  ([lib/markdown.ts](../lib/markdown.ts)). Bonus : branche-le sur `./run test`.
- **Captures d'écran du README.** Lance l'app (`./run start`), capture quelques
  pages, ajoute-les au [README](../README.md). Un README qui montre donne envie.

### 🟡 Intermédiaire
- **Généraliser le bouton « Signaler ».** Le composant
  [`ReportForm`](../features/admin/report-form.tsx) n'est branché que sur la page
  d'une question du forum. Ajoute-le aux pages détail des **ressources**, des
  **problèmes**, des **solutions** et des **communautés** (il prend déjà
  `targetType` + `targetId`).
- **Pagination des listes.** `/communities`, `/explorer`, `/knowledge` et
  `/forum` chargent tout d'un coup. Ajoute une pagination (ou « charger plus »).
- **Accessibilité.** Audite une page au clavier + lecteur d'écran, corrige les
  `aria-*` et contrastes manquants.

### 🔴 Plus ambitieux
- **Avatar de profil.** Upload et affichage d'une image sur le profil
  (`/dashboard/settings`) et le profil public (`/u/[username]`).
- **Démarrer l'i18n.** Extraire les chaînes de l'interface pour préparer le
  multilingue (français → anglais, puis langues africaines).

## 🌍 Sans coder (tout aussi précieux)

- **Traduire** une page ou une ressource vers une langue africaine (Kiswahili,
  Wolof, Yorùbá, العربية, Hausa, Lingala, isiZulu…).
- **Rédiger un problème réel** de ton pays/secteur, ou **une ressource**
  (article, tutoriel) — c'est le cœur de la plateforme.
- **Améliorer la doc** : corriger des typos, clarifier le [CONTRIBUTING](../CONTRIBUTING.md), traduire une section.
- **Proposer un logo** ou une identité visuelle (couleurs de marque : or `#F5B800`, noir `#111111`, vert `#22C55E`).

---

Besoin d'aide pour te lancer ? Voir [SUPPORT.md](../SUPPORT.md). **Karibu,
akwaaba, bienvenue — welcome.** 🌍✊🏾
