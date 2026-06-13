// Jeu de données de démo (idempotent). Lancé via `node seed.mjs`.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@afrocodeurs.org" },
    update: {},
    create: {
      email: "admin@afrocodeurs.org",
      username: "admin",
      name: "Admin AfroCodeurs",
      role: "ADMIN",
      passwordHash,
    },
  });
  const amina = await db.user.upsert({
    where: { email: "amina@afrocodeurs.org" },
    update: {},
    create: {
      email: "amina@afrocodeurs.org",
      username: "amina",
      name: "Amina Diop",
      role: "CONTRIBUTOR",
      passwordHash,
      profile: {
        create: {
          bio: "Développeuse fullstack à Dakar. Passionnée de civic tech.",
          country: "Sénégal",
          city: "Dakar",
          languages: ["Français", "English", "Wolof"],
          skills: ["React", "Next.js", "PostgreSQL"],
        },
      },
    },
  });
  const kwame = await db.user.upsert({
    where: { email: "kwame@afrocodeurs.org" },
    update: {},
    create: {
      email: "kwame@afrocodeurs.org",
      username: "kwame",
      name: "Kwame Mensah",
      role: "USER",
      passwordHash,
    },
  });

  const communities = [
    {
      name: "React Afrique Francophone",
      type: "SKILL",
      description:
        "Entraide React / Next.js pour les développeurs francophones du continent.",
    },
    {
      name: "Dakar Tech",
      type: "GEO",
      description: "La communauté des makers de Dakar.",
      country: "Sénégal",
      city: "Dakar",
    },
    {
      name: "HealthTech Africa",
      type: "SECTOR",
      description: "Innovations santé adaptées aux réalités du continent.",
    },
  ];
  for (const c of communities) {
    await db.community.upsert({
      where: { slug: slug(c.name) },
      update: {},
      create: {
        ...c,
        slug: slug(c.name),
        members: {
          create: [
            { userId: admin.id, role: "ADMIN" },
            { userId: amina.id, role: "MEMBER" },
          ],
        },
      },
    });
  }

  const problems = [
    {
      title: "Accès au diagnostic médical en zone rurale",
      summary:
        "Les centres de santé ruraux manquent d'outils de diagnostic rapides.",
      description:
        "Dans de nombreuses zones rurales, l'accès à un diagnostic fiable est limité par le manque de personnel et d'équipements. Comment outiller les agents de santé communautaires ?",
      sector: "Santé",
      countries: ["Sénégal", "Mali"],
      impactLevel: 5,
      difficultyLevel: 4,
      createdById: amina.id,
    },
    {
      title: "Traçabilité des produits agricoles locaux",
      summary: "Difficile de tracer l'origine des produits sur les marchés.",
      description:
        "Les consommateurs et exportateurs manquent d'outils simples pour tracer l'origine et la qualité des produits agricoles. Une solution mobile-first serait précieuse.",
      sector: "Agriculture",
      countries: ["Côte d'Ivoire"],
      impactLevel: 4,
      difficultyLevel: 3,
      createdById: kwame.id,
    },
  ];
  for (const p of problems) {
    await db.problem.upsert({
      where: { slug: slug(p.title) },
      update: {},
      create: { ...p, slug: slug(p.title), status: "VALIDATED" },
    });
  }

  const articles = [
    {
      title: "Déployer Next.js 16 sur un VPS pas à pas",
      summary: "Un guide complet pour mettre en production une app Next.js.",
      content:
        "# Déployer Next.js 16\n\nCe guide couvre la mise en production sur un VPS Linux : build, process manager, reverse proxy et HTTPS.\n\n## Prérequis\n\n- Un VPS Ubuntu\n- Node.js 20+\n\n## Étapes\n\n1. `npm run build`\n2. Lancer avec un process manager\n3. Configurer Nginx en reverse proxy\n",
      type: "GUIDE",
      level: "Intermédiaire",
    },
    {
      title: "Introduction aux Server Actions",
      summary: "Muter des données sans API REST, directement depuis le serveur.",
      content:
        "# Server Actions\n\nLes **Server Actions** permettent de muter des données côté serveur sans créer d'API REST.\n\n```ts\n\"use server\";\nexport async function createPost(formData) {\n  // ...\n}\n```\n\nElles s'utilisent directement avec `<form action={createPost}>`.\n",
      type: "ARTICLE",
      level: "Débutant",
    },
  ];
  for (const a of articles) {
    await db.knowledge.upsert({
      where: { slug: slug(a.title) },
      update: {},
      create: {
        ...a,
        slug: slug(a.title),
        authorId: amina.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  // Une ressource en attente de validation (pour le panneau admin)
  await db.knowledge.upsert({
    where: { slug: slug("Optimiser les requetes Prisma") },
    update: {},
    create: {
      title: "Optimiser les requêtes Prisma",
      slug: slug("Optimiser les requetes Prisma"),
      summary: "Éviter les N+1 et tirer parti des includes.",
      content:
        "# Optimiser Prisma\n\nUtilisez `include` et `select` pour limiter les allers-retours, et `groupBy` pour les agrégats.\n",
      type: "ARTICLE",
      authorId: amina.id,
      status: "SUBMITTED",
    },
  });

  const solutions = [
    {
      name: "Paydunya",
      description:
        "Passerelle de paiement mobile money pour l'Afrique de l'Ouest.",
      type: "API",
      country: "Sénégal",
      websiteUrl: "https://paydunya.com",
    },
    {
      name: "Andela",
      description: "Réseau de talents tech africains pour entreprises mondiales.",
      type: "ORGANIZATION",
    },
    {
      name: "Senegal Open Data",
      description: "Portail de données ouvertes pour la recherche et la civic tech.",
      type: "SERVICE",
      country: "Sénégal",
    },
  ];
  for (const s of solutions) {
    await db.solution.upsert({
      where: { slug: slug(s.name) },
      update: {},
      create: { ...s, slug: slug(s.name), createdById: kwame.id },
    });
  }

  // Forum : une question avec une réponse acceptée
  const q = await db.question.upsert({
    where: { slug: slug("Comment structurer un projet Next.js par features") },
    update: {},
    create: {
      title: "Comment structurer un projet Next.js par features ?",
      slug: slug("Comment structurer un projet Next.js par features"),
      body: "Je débute sur Next.js App Router et je me demande comment organiser le code par fonctionnalité plutôt que par type de fichier. Des conseils ?",
      authorId: kwame.id,
      status: "SOLVED",
    },
  });
  const existingAnswer = await db.answer.findFirst({
    where: { questionId: q.id },
  });
  if (!existingAnswer) {
    await db.answer.create({
      data: {
        questionId: q.id,
        body: "Une approche éprouvée : un dossier `features/<domaine>/` par fonctionnalité (actions, composants), et `app/` qui ne fait qu'assembler. Garde `lib/` pour le transversal (db, auth, validators).",
        authorId: amina.id,
        isAccepted: true,
      },
    });
  }

  // Relation de démo : Paydunya (solution) SOLVES le problème de traçabilité.
  const paydunya = await db.solution.findUnique({
    where: { slug: "paydunya" },
  });
  const trac = await db.problem.findUnique({
    where: { slug: slug("Traçabilité des produits agricoles locaux") },
  });
  if (paydunya && trac) {
    await db.entityRelation.upsert({
      where: {
        sourceType_sourceId_relationType_targetType_targetId: {
          sourceType: "SOLUTION",
          sourceId: paydunya.id,
          relationType: "SOLVES",
          targetType: "PROBLEM",
          targetId: trac.id,
        },
      },
      update: {},
      create: {
        sourceType: "SOLUTION",
        sourceId: paydunya.id,
        relationType: "SOLVES",
        targetType: "PROBLEM",
        targetId: trac.id,
        createdById: kwame.id,
      },
    });
  }

  // Réputation de démo (idempotent : seulement si le registre est vide).
  if ((await db.reputationEvent.count()) === 0) {
    await db.reputationEvent.createMany({
      data: [
        ...Array(4).fill({ userId: amina.id, action: "UPVOTE_RECEIVED", points: 10, dimension: "CONTRIBUTION" }),
        { userId: amina.id, action: "KNOWLEDGE_PUBLISHED", points: 20, dimension: "CONTRIBUTION" },
        { userId: amina.id, action: "KNOWLEDGE_PUBLISHED", points: 20, dimension: "CONTRIBUTION" },
        { userId: amina.id, action: "ANSWER_ACCEPTED", points: 15, dimension: "CONTRIBUTION" },
        { userId: amina.id, action: "ANSWER_POSTED", points: 5, dimension: "CONTRIBUTION" },
        { userId: amina.id, action: "PROBLEM_PROPOSED", points: 8, dimension: "CONTRIBUTION" },
        { userId: amina.id, action: "COMMUNITY_JOINED", points: 1, dimension: "PARTICIPATION" },
        { userId: kwame.id, action: "PROBLEM_PROPOSED", points: 8, dimension: "CONTRIBUTION" },
        ...Array(3).fill({ userId: kwame.id, action: "SOLUTION_ADDED", points: 8, dimension: "CONTRIBUTION" }),
        { userId: kwame.id, action: "RELATION_ADDED", points: 3, dimension: "CONTRIBUTION" },
        { userId: kwame.id, action: "QUESTION_ASKED", points: 2, dimension: "PARTICIPATION" },
        { userId: kwame.id, action: "UPVOTE_RECEIVED", points: 10, dimension: "CONTRIBUTION" },
        { userId: admin.id, action: "KNOWLEDGE_PUBLISHED", points: 20, dimension: "CONTRIBUTION" },
        { userId: admin.id, action: "SOLUTION_ADDED", points: 8, dimension: "CONTRIBUTION" },
        { userId: admin.id, action: "COMMUNITY_JOINED", points: 1, dimension: "PARTICIPATION" },
      ],
    });
  }

  console.log("SEED_OK");
}

main()
  .then(() => db.$disconnect())
  .catch((error) => {
    console.error("SEED_FAIL:", error);
    db.$disconnect();
    process.exit(1);
  });
