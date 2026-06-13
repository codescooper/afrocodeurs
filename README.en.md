<div align="center">

# 🌍 AfroCodeurs

### _From problems to solutions, together._

[🇫🇷 Français](README.md) · **🇬🇧 English**

The **open-source** ecosystem where Africa's tech talent turns the continent's
**real problems** into **concrete solutions** — together.

![Made in Africa](https://img.shields.io/badge/Made%20in-Africa%20🌍-F5B800?style=flat-square&labelColor=111111)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22C55E?style=flat-square&labelColor=111111)
![For the AfroMakers](https://img.shields.io/badge/by%20%26%20for-the%20AfroMakers-111111?style=flat-square)

</div>

---

## ✊ Why AfroCodeurs

Africa has no shortage of problems to solve. It has no shortage of talent to
solve them either. **What's missing is the space to connect the two.**

AfroCodeurs is not a course platform, not just a forum, not a social network.
It's a **continental digital infrastructure** to turn real problems — rural
access to medical diagnosis, traceability of farm produce, financial
inclusion… — into solutions built **by Africans, for Africa**.

Our philosophy fits in three words: **Build Before Consume.** Here we celebrate
those who **build, document, pass on knowledge and contribute** — not only those
who consume.

## 🧭 The core principle: the problem at the center

Everything on the platform — a piece of knowledge, a project, a solution, an
opportunity, an expertise — **connects back to a real problem.** That's the
thread that turns a community into a problem-solving machine.

## 🛠️ What you can do here

| | Module | |
|---|---|---|
| 🔎 | **Explore** | Browse and propose the continent's problems |
| 📚 | **Learn** | Markdown articles, tutorials and guides, community-reviewed |
| 🤝 | **Communities** | Gather by craft, country, university or sector |
| 💬 | **Forum** | Ask, answer, vote, accept the best answer |
| 🗺️ | **AfroAtlas** | Map solutions, APIs, startups and organizations |
| 💼 | **Opportunities** | Jobs, internships, contests, scholarships, funding _(v2)_ |

## 👩🏾‍💻 You are an AfroMaker

An **AfroMaker** is someone who learns, builds and shares. You don't need to be
an expert — **you just need the drive.** The platform is built first for
**students and self-taught builders**, then developers, designers, sysadmins,
AI and cybersecurity folks… across the continent **and the diaspora**.

> 💛 Your first commit matters as much as your hundredth. We're waiting for you.

## ⚡ Get started in 5 minutes

**Requirements:** [Node.js](https://nodejs.org) 20+, [PostgreSQL](https://www.postgresql.org), Git.

```bash
# 1. Clone
git clone <repo-url> afrocodeurs && cd afrocodeurs

# 2. Install dependencies
npm install

# 3. Configure the environment
cp .env.example .env
#   → set DATABASE_URL and generate AUTH_SECRET (openssl rand -base64 32)

# 4. Create the schema + demo data
npx prisma migrate deploy
node seed.mjs            # demo accounts: amina@ / kwame@ / admin@afrocodeurs.org (password: password123)

# 5. Run
./run start             # → http://localhost:3000   (Windows: .\run.ps1 start)
```

👉 `./run help` lists **all** project commands (build, test, lint, logs, clean,
deploy…). When in doubt: `./run doctor`.

## 🤲 Contribute

**Yes, you.** Whether you're writing your first `git commit` or your thousandth,
there's a place for you. And **you don't have to code**: translations into
African languages, writing problems and resources, design, testing,
documentation… it all counts.

➡️ **Read the guide: [CONTRIBUTING.md](CONTRIBUTING.md)** — setup, workflow, and
your first easy contributions. (Written in French; English contributions are
warmly welcome — a quick-start in English is included.)

## 🌍 Pan-African by design

The continent is plural — so is this project. The code and primary docs are in
**French**, but **English is welcome** (issues, PRs, discussions), and content
can live in **all our languages** — Kiswahili, Wolof, Yorùbá, العربية, Português,
Hausa, Amharic, Lingala, isiZulu…

We move in the spirit of **Ubuntu**: _I am because we are._ From Cairo to Cape
Town, from Dakar to Nairobi, and everywhere in the diaspora — **let's build what
no one will build for us.**

## 🧱 Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Prisma 7 +
PostgreSQL · Auth.js v5 · Tailwind CSS 4. A modern, readable stack designed so
you **learn by contributing**. Architecture notes in [AGENTS.md](AGENTS.md),
progress in [STATUS.md](STATUS.md).

## 📜 License

Open source under the **MIT** license — see [`LICENSE`](LICENSE). By taking part,
you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
Brand: gold `#F5B800`, black `#111111`, green `#22C55E`.

<div align="center">

---

**From problems to solutions, together.** 🌍✊🏾

</div>
