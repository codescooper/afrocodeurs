<div align="center">

# 🌍 AfroCodeurs

### _Des problèmes aux solutions, ensemble._

**🇫🇷 Français** · [🇬🇧 English](README.en.md)

L'écosystème **open source** où les talents tech d'Afrique transforment
les **problèmes réels** du continent en **solutions concrètes** — ensemble.

![Made in Africa](https://img.shields.io/badge/Made%20in-Africa%20🌍-F5B800?style=flat-square&labelColor=111111)
![PRs Welcome](https://img.shields.io/badge/PRs-bienvenues-22C55E?style=flat-square&labelColor=111111)
![Pour les AfroMakers](https://img.shields.io/badge/par%20%26%20pour-les%20AfroMakers-111111?style=flat-square)

</div>

> **In short (EN):** AfroCodeurs is a pan-African open-source platform where
> developers, designers and self-taught builders turn the continent's real
> problems into concrete solutions — together. Newcomers welcome — start with
> [CONTRIBUTING](CONTRIBUTING.md) · [English README](README.en.md).

---

## ✊ Pourquoi AfroCodeurs

L'Afrique ne manque pas de problèmes à résoudre. Elle ne manque pas non plus de
talents pour les résoudre. **Ce qui manque, c'est l'espace pour les relier.**

AfroCodeurs n'est ni une plateforme de cours, ni un simple forum, ni un réseau
social. C'est une **infrastructure numérique continentale** pour transformer des
problèmes réels — l'accès au diagnostic médical en zone rurale, la traçabilité
des produits agricoles, l'inclusion financière… — en solutions construites
**par les Africains, pour l'Afrique**.

Notre philosophie tient en trois mots : **Build Before Consume.** Ici, on
valorise celles et ceux qui **construisent, documentent, transmettent et
contribuent** — pas seulement celles et ceux qui consomment.

## 🧭 Le principe : le problème au centre

Tout sur la plateforme — une connaissance, un projet, une solution, une
opportunité, une expertise — **se relie à un problème réel.** C'est le fil rouge
qui transforme une communauté en machine à résoudre.

## 🛠️ Ce que tu peux faire ici

| | Module | |
|---|---|---|
| 🔎 | **Explorer** | Parcourir et proposer les problèmes du continent |
| 📚 | **Apprendre** | Articles, tutoriels et guides en Markdown, validés par la communauté |
| 🤝 | **Communautés** | Se rassembler par métier, pays, université ou secteur |
| 💬 | **Forum** | Poser des questions, répondre, voter, accepter la meilleure réponse |
| 🗺️ | **AfroAtlas** | Cartographier les solutions, APIs, startups et organisations |
| 💼 | **Opportunités** | Emplois, stages, concours, bourses, financements _(v2)_ |

## 👩🏾‍💻 Tu es un·e AfroMaker

Un **AfroMaker**, c'est quelqu'un qui apprend, construit et partage. Pas besoin
d'être expert·e — **il faut juste l'envie.** La plateforme s'adresse d'abord aux
**étudiant·e·s et autodidactes**, puis aux développeur·se·s, designers,
administrateur·rice·s systèmes, spécialistes IA et cybersécurité… du continent
**et de la diaspora**.

> 💛 Ton premier commit compte autant que le centième. On t'attend.

## ⚡ Démarrer en 5 minutes

**Prérequis :** [Node.js](https://nodejs.org) 20+, [PostgreSQL](https://www.postgresql.org), Git.

```bash
# 1. Cloner
git clone <url-du-repo> afrocodeurs && cd afrocodeurs

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
#   → renseigne DATABASE_URL et génère AUTH_SECRET (openssl rand -base64 32)

# 4. Créer le schéma + des données de démo
npx prisma migrate deploy
node seed.mjs            # comptes de démo : amina@ / kwame@ / admin@afrocodeurs.org (mot de passe : password123)

# 5. Lancer
./run start             # → http://localhost:3000   (Windows : .\run.ps1 start)
```

👉 `./run help` liste **toutes** les commandes du projet (build, test, lint,
logs, clean, deploy…). En cas de doute : `./run doctor`.

## 🤲 Contribuer

**Oui, toi.** Que tu écrives ton premier `git commit` ou ton millième, il y a une
place pour toi. Et **pas besoin de coder** : traductions vers les langues
africaines, rédaction de problèmes et de ressources, design, tests,
documentation… tout compte.

➡️ **Lis le guide : [CONTRIBUTING.md](CONTRIBUTING.md)** — mise en route,
workflow, et tes premières contributions faciles.

## 🌍 Un projet panafricain, par nature

Le continent est pluriel : ce projet l'est aussi. Le code et la doc principale
sont en **français**, mais l'**anglais est bienvenu** (issues, PR, discussions),
et les contenus peuvent vivre dans **toutes nos langues** — Kiswahili, Wolof,
Yorùbá, العربية, Português, Hausa, Amharic, Lingala, isiZulu…

Nous avançons dans l'esprit de l'**Ubuntu** : _je suis parce que nous sommes._
Du Caire à Cape Town, de Dakar à Nairobi, et partout dans la diaspora —
**construisons ce que personne ne construira à notre place.**

## 🧱 Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Prisma 7 +
PostgreSQL · Auth.js v5 · Tailwind CSS 4. Une stack moderne et lisible, pensée
pour qu'on **apprenne en contribuant**. Détails d'architecture dans
[AGENTS.md](AGENTS.md) et l'avancement dans [STATUS.md](STATUS.md).

## 📜 Licence

Open source — licence **MIT** recommandée (à finaliser dans `LICENSE`).
Marque : or `#F5B800`, noir `#111111`, vert `#22C55E`.

<div align="center">

---

**Des problèmes aux solutions, ensemble.** 🌍✊🏾

</div>
