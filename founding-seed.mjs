/**
 * Contenu fondateur d'AfroCodeurs — à exécuter sur une base vierge (prod).
 * Idempotent (upserts par slug/email). N'utilise PAS les comptes de démo.
 *
 *   DATABASE_URL="<url>" node founding-seed.mjs
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PROBLEMS = [
  {
    title: "Paiement mobile interopérable entre opérateurs",
    sector: "Fintech",
    summary:
      "Les portefeuilles mobiles restent cloisonnés par opérateur, freinant les transferts entre réseaux.",
    description:
      "Envoyer de l'argent d'un opérateur de mobile money à un autre reste coûteux ou impossible dans de nombreux pays. Comment construire une couche d'interopérabilité ouverte, sûre et bon marché entre les portefeuilles ?",
    impactLevel: 5,
    difficultyLevel: 4,
    countries: ["Sénégal", "Côte d'Ivoire", "Kenya"],
  },
  {
    title: "Accès à un Internet fiable et abordable en zone rurale",
    sector: "Connectivité",
    summary:
      "Le coût et la couverture de la data excluent encore une grande partie des zones rurales.",
    description:
      "Comment apporter une connectivité fiable et abordable hors des grandes villes : réseaux maillés communautaires, partage de bande passante, mise en cache locale, énergie solaire pour les relais ?",
    impactLevel: 5,
    difficultyLevel: 5,
    countries: [],
  },
  {
    title: "Outils et interfaces numériques en langues africaines",
    sector: "Inclusion",
    summary:
      "La plupart des outils n'existent qu'en anglais ou en français, excluant des millions de locuteurs.",
    description:
      "Claviers, synthèse vocale, traduction, correcteurs : comment outiller le wolof, le swahili, le yoruba, l'amharique et d'autres langues pour des interfaces vraiment inclusives ?",
    impactLevel: 4,
    difficultyLevel: 3,
    countries: [],
  },
  {
    title: "Identité numérique pour les populations non bancarisées",
    sector: "Identité",
    summary:
      "Sans identité vérifiable, l'accès aux services financiers et publics reste bloqué.",
    description:
      "Comment offrir une identité numérique vérifiable, respectueuse de la vie privée et utilisable hors-ligne, aux personnes sans pièce d'identité formelle ?",
    impactLevel: 4,
    difficultyLevel: 4,
    countries: ["Nigeria"],
  },
  {
    title: "Traçabilité des chaînes d'approvisionnement agricoles",
    sector: "AgriTech",
    summary:
      "Le manque de traçabilité empêche les producteurs d'accéder à de meilleurs marchés.",
    description:
      "Du champ au marché : comment tracer l'origine, la qualité et le prix juste des produits agricoles avec des outils simples (SMS, QR codes, registres partagés) accessibles aux petits producteurs ?",
    impactLevel: 4,
    difficultyLevel: 3,
    countries: ["Ghana", "Kenya"],
  },
  {
    title: "Téléconsultation médicale en zones sous-équipées",
    sector: "HealthTech",
    summary:
      "Le ratio médecin/habitant très faible appelle des solutions de santé à distance.",
    description:
      "Comment connecter patients et soignants malgré le faible débit : files d'attente asynchrones, dossiers médicaux légers, diagnostic assisté hors-ligne, relais d'agents de santé communautaires ?",
    impactLevel: 5,
    difficultyLevel: 4,
    countries: [],
  },
  {
    title: "Apprentissage en ligne adapté au faible débit",
    sector: "EdTech",
    summary:
      "Les plateformes lourdes excluent les apprenants à connexion limitée.",
    description:
      "Comment concevoir des parcours d'apprentissage qui fonctionnent en mode quasi hors-ligne : contenus légers, synchronisation différée, distribution par SMS/USSD ou clés USB ?",
    impactLevel: 4,
    difficultyLevel: 2,
    countries: [],
  },
  {
    title: "Logistique du dernier kilomètre en milieu urbain dense",
    sector: "Logistique",
    summary:
      "L'adressage informel complique la livraison dans les grandes villes.",
    description:
      "Sans adresses formelles, comment optimiser la livraison du dernier kilomètre : géocodage communautaire, points relais, repères locaux, optimisation de tournées à moto ?",
    impactLevel: 3,
    difficultyLevel: 3,
    countries: ["Nigeria", "Égypte"],
  },
];

const KNOWLEDGE = [
  {
    title: "Démarrer avec les API de Mobile Money en Afrique de l'Ouest",
    type: "TUTORIAL",
    level: "Intermédiaire",
    summary:
      "Un point de départ concret pour intégrer un paiement mobile dans votre application.",
    content:
      "# Démarrer avec le Mobile Money\n\nIntégrer un paiement mobile demande de comprendre quelques concepts communs aux opérateurs : initiation de paiement, callback de confirmation, idempotence et réconciliation.\n\n## Les étapes clés\n\n- Obtenir des identifiants en environnement **sandbox**.\n- Initier une requête de paiement (montant, numéro, référence unique).\n- Traiter le **webhook** de confirmation de façon idempotente.\n- Réconcilier quotidiennement les transactions.\n\n## Bonnes pratiques\n\nNe faites jamais confiance au seul retour côté client : la source de vérité est le webhook signé de l'opérateur. Stockez chaque transaction avec une référence unique pour éviter les doublons.",
  },
  {
    title: "Concevoir pour le faible débit : le guide pratique",
    type: "GUIDE",
    level: "Débutant",
    summary:
      "Des techniques éprouvées pour des applications rapides même sur des connexions lentes.",
    content:
      "# Concevoir pour le faible débit\n\nUne grande partie des utilisateurs africains accèdent au web sur mobile, avec une data limitée. Voici comment livrer une expérience rapide.\n\n## Principes\n\n- **Réduire le poids** : images compressées, polices système, pas de JS inutile.\n- **Mettre en cache** agressivement (Service Worker, offline-first).\n- **Dégrader gracieusement** : le contenu d'abord, l'enrichissement ensuite.\n- **Mesurer** sur de vrais appareils et réseaux 3G.\n\nChaque kilo-octet compte : il a un coût réel pour l'utilisateur.",
  },
  {
    title: "Déployer une application web à moindre coût",
    type: "TUTORIAL",
    level: "Intermédiaire",
    summary:
      "Mettre en ligne un projet sans exploser son budget d'hébergement.",
    content:
      "# Déployer à moindre coût\n\nLancer un produit ne nécessite pas une infrastructure coûteuse. Plusieurs plateformes offrent un palier gratuit ou très abordable.\n\n## Checklist\n\n- Une base PostgreSQL managée (palier gratuit pour démarrer).\n- Un hébergeur qui build depuis Git et redéploie automatiquement.\n- Des variables d'environnement pour les secrets (jamais dans le dépôt).\n- Un nom de domaine et HTTPS automatique.\n\nCommencez petit, mesurez l'usage, puis montez en charge quand c'est nécessaire.",
  },
  {
    title: "Prendre en charge les langues africaines dans son application",
    type: "ARTICLE",
    level: "Intermédiaire",
    summary:
      "Les bases de l'internationalisation pour des interfaces réellement inclusives.",
    content:
      "# Internationalisation et langues africaines\n\nSupporter plusieurs langues va au-delà de la traduction : il faut penser pluriels, sens de lecture, claviers et formats.\n\n## Pour bien démarrer\n\n- Externalisez toutes les chaînes de texte dès le début.\n- Prévoyez des espaces flexibles (certaines traductions sont plus longues).\n- Impliquez des locuteurs natifs pour la relecture.\n- Commencez par une ou deux langues, puis élargissez.\n\nL'inclusion linguistique élargit l'audience et la confiance.",
  },
  {
    title: "Les bases de la sécurité d'une API",
    type: "GUIDE",
    level: "Débutant",
    summary: "Les réflexes essentiels pour ne pas exposer ses utilisateurs.",
    content:
      "# Sécuriser une API : les bases\n\nQuelques principes simples évitent la majorité des incidents.\n\n## Les essentiels\n\n- **Authentification** robuste et **autorisation** par rôle.\n- **Valider** toutes les entrées côté serveur.\n- **Limiter le débit** (rate limiting) sur les routes sensibles.\n- **Chiffrer** en transit (HTTPS) et hacher les mots de passe.\n- **Journaliser** sans exposer de données personnelles.\n\nLa sécurité n'est pas une option : c'est un respect dû à vos utilisateurs.",
  },
];

const SOLUTIONS = [
  {
    name: "Ushahidi",
    type: "SOFTWARE",
    country: "Kenya",
    websiteUrl: "https://www.ushahidi.com",
    license: "AGPL-3.0",
    description:
      "Plateforme open-source de collecte de données et de cartographie de crise, née au Kenya et utilisée dans le monde entier pour le crowdsourcing d'informations.",
  },
  {
    name: "Mojaloop",
    type: "API",
    websiteUrl: "https://mojaloop.io",
    license: "Apache-2.0",
    description:
      "Logiciel open-source de référence pour des paiements instantanés interopérables entre institutions financières et opérateurs de mobile money.",
  },
  {
    name: "Africa's Talking",
    type: "API",
    country: "Kenya",
    websiteUrl: "https://africastalking.com",
    description:
      "Ensemble d'API (SMS, USSD, voix, paiements) pensées pour les développeurs africains, permettant d'atteindre les utilisateurs même sans smartphone.",
  },
  {
    name: "FrontlineSMS",
    type: "SOFTWARE",
    websiteUrl: "https://www.frontlinesms.com",
    description:
      "Outil de communication par SMS pour les organisations en contexte à faibles ressources, fonctionnant sans connexion Internet permanente.",
  },
];

const COMMUNITIES = [
  { name: "React Afrique Francophone", type: "SKILL" },
  { name: "Python & Data Science Afrique", type: "SKILL" },
  { name: "Fintech Builders Africa", type: "SECTOR" },
  { name: "Open Source Africa", type: "PROJECT" },
  { name: "Women in Tech Africa", type: "SECTOR" },
];

async function main() {
  const founder = await db.user.upsert({
    where: { email: "hello@afrocodeurs.org" },
    update: { emailVerified: new Date() },
    create: {
      email: "hello@afrocodeurs.org",
      username: "afrocodeurs",
      name: "AfroCodeurs",
      role: "ADMIN",
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "Compte officiel de la communauté AfroCodeurs. Build Before Consume.",
        },
      },
    },
  });

  for (const p of PROBLEMS) {
    const slug = slugify(p.title);
    await db.problem.upsert({
      where: { slug },
      update: {},
      create: { ...p, slug, createdById: founder.id },
    });
  }

  for (const k of KNOWLEDGE) {
    const slug = slugify(k.title);
    await db.knowledge.upsert({
      where: { slug },
      update: {},
      create: {
        ...k,
        slug,
        authorId: founder.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  for (const s of SOLUTIONS) {
    const slug = slugify(s.name);
    await db.solution.upsert({
      where: { slug },
      update: {},
      create: { ...s, slug, createdById: founder.id },
    });
  }

  for (const c of COMMUNITIES) {
    const slug = slugify(c.name);
    const community = await db.community.upsert({
      where: { slug },
      update: {},
      create: { ...c, slug },
    });
    await db.communityMember.upsert({
      where: {
        userId_communityId: { userId: founder.id, communityId: community.id },
      },
      update: {},
      create: { userId: founder.id, communityId: community.id, role: "ADMIN" },
    });
  }

  const [problems, knowledge, solutions, communities] = await Promise.all([
    db.problem.count(),
    db.knowledge.count(),
    db.solution.count(),
    db.community.count(),
  ]);
  console.log(
    `FOUNDING_SEED_OK problems=${problems} knowledge=${knowledge} solutions=${solutions} communities=${communities}`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
