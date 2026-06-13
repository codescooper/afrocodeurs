# 🤝 Contribuer à AfroCodeurs

> _Des problèmes aux solutions, ensemble._ — et « ensemble » commence par **toi**.

Merci d'être ici. Que tu sois étudiant·e à Lomé, autodidacte à Kinshasa,
développeuse à Tunis ou dans la diaspora à Montréal — **tu as ta place dans ce
projet.** Ce guide est fait pour que ta première contribution soit simple,
réussie, et fière.

---

## 💛 Tu as ta place ici

- Tu n'as **jamais ouvert de Pull Request** ? Parfait, on adore les premières fois.
- Tu débutes ? La moitié du projet a été pensée pour qu'on **apprenne en contribuant**.
- Tu ne parles pas français couramment ? **L'anglais est bienvenu** (voir [English quick-start](#-english-quick-start) plus bas).
- Tu ne codes pas ? **Tu peux quand même contribuer** (voir juste en dessous).

Notre seule règle de fond, c'est le respect — esprit **Ubuntu**, _je suis parce
que nous sommes_. Pas de mépris, pas de gatekeeping. On élève, on n'écrase pas.

> 📜 En participant, tu acceptes notre [Code de conduite](CODE_OF_CONDUCT.md).

## ✋ Contribuer, même sans coder

Le projet est **panafricain** : il a besoin de bien plus que du code.

- 🌍 **Traduire** l'interface ou des ressources vers une langue africaine (Kiswahili, Wolof, Yorùbá, العربية, Hausa, Lingala, isiZulu…).
- 🧩 **Décrire un problème réel** de ton pays/ton secteur (santé, agri, éducation, énergie, finance…) — c'est le cœur de la plateforme.
- 📚 **Écrire une ressource** (article, tutoriel, guide) ou **référencer une solution** dans l'Atlas.
- 🎨 **Design & UX**, ♿ **accessibilité**, 🐛 **signaler un bug**, ✍️ **améliorer la doc**, 🧪 **tester**.

Ouvre simplement une **issue** pour proposer — on t'aide à transformer ça en contribution.

## 🚀 Ta première contribution (code)

1. Cherche une issue étiquetée **`good first issue`** ou **`help wanted`** — ou pioche dans notre **[liste d'idées pour démarrer](docs/good-first-issues.md)**.
2. Commente « je prends » pour que personne ne travaille en double.
3. Même une **correction de typo** est une vraie contribution. Commence petit.

## ⚙️ Mise en route

Suis le **[Démarrer en 5 minutes](README.md#-démarrer-en-5-minutes)** du README
(Node 20+, PostgreSQL, `.env`, migration, seed). Puis vérifie que tout est bon :

```bash
./run doctor     # diagnostic env + commandes du projet   (Windows : .\run.ps1 doctor)
./run start      # lance l'app sur http://localhost:3000
```

> ℹ️ Cette version de Next.js / Prisma a des **spécificités** : lis
> [AGENTS.md](AGENTS.md) avant de coder (notamment la config DB Prisma 7).

## 🔁 Le workflow, pas à pas

```bash
# 1. Forke le repo, puis clone TON fork
git clone <url-de-ton-fork> && cd afrocodeurs

# 2. Crée une branche au nom parlant
git checkout -b feat/forum-mentions      # ou fix/…, docs/…, chore/…

# 3. Code ou écris ✨ (et teste dans l'app)

# 4. AVANT de committer — passe les contrôles qualité
./run format --fix        # met le code au propre
./run lint                # analyse
./run build               # types + build
#   Utilisateur·rice de Claude Code ? Tape : /awema-pre-commit-check  (verdict GO / NO-GO)

# 5. Committe clair (Conventional Commits, en français)
git commit -m "feat(forum): mentions @utilisateur dans les réponses"

# 6. Pousse et ouvre une Pull Request
git push origin feat/forum-mentions
```

**Convention de commit** : `type(portée): description`. Types courants —
`feat` (fonctionnalité), `fix` (correctif), `docs`, `chore`, `refactor`, `test`.

**Ta Pull Request** : explique **quel problème elle résout** (on relie tout à un
problème 😉), comment tester, et joins une capture si c'est visuel. Une PR n'a
pas besoin d'être parfaite pour être ouverte — on revoit ensemble, avec
bienveillance.

## 🧰 Les commandes du projet (`./run`)

| Commande | Rôle |
|---|---|
| `./run start` | Lancer l'app en développement |
| `./run build` | Build de production (types inclus) |
| `./run test` | Lancer les tests |
| `./run lint` · `./run format --fix` | Qualité & formatage |
| `./run logs` · `./run clean` · `./run doctor` | Logs · ménage · diagnostic |

Windows : `.\run.ps1 <commande>`. Détails : [scripts/README.md](scripts/README.md).

## 🌍 Langues

- **Français** : langue principale du code et de la doc.
- **Anglais** : bienvenu pour les issues, PR et discussions.
- **Langues africaines** : bienvenues pour les **contenus** (problèmes, ressources, traductions d'interface).

Écris dans la langue où tu es le plus à l'aise — on se comprendra.

## 🏅 Reconnaissance

Chaque contributeur·rice est un·e **AfroMaker**. Tes contributions construisent
ta réputation sur la plateforme et seront créditées. **Build Before Consume** :
ici, celles et ceux qui bâtissent passent devant.

## 🙋 Besoin d'aide ?

Ouvre une **issue** avec ta question, ou demande dans la communauté. Aucune
question n'est « bête » — on a toutes et tous commencé quelque part.

---

## 🇬🇧 English quick-start

Welcome! English contributions are warmly welcome.

1. **Setup** — follow the [README quick-start](README.en.md#-get-started-in-5-minutes) (Node 20+, PostgreSQL, `.env`, migrate, seed).
2. **Branch** — `git checkout -b feat/your-thing`.
3. **Before committing** — run `./run format --fix && ./run lint && ./run build` (or `/awema-pre-commit-check` in Claude Code).
4. **Commit** — Conventional Commits, e.g. `feat(forum): @user mentions`. French or English are both fine.
5. **Open a PR** — describe **which problem it solves**, and how to test it.

Not a coder? You can still help: **translations into African languages**,
writing real-world **problems** and **resources**, design, testing, docs. Open
an issue to propose it.

Read [AGENTS.md](AGENTS.md) before coding — this Next.js/Prisma version has
specifics. **Karibu, akwaaba, bienvenue — welcome.** 🌍✊🏾
