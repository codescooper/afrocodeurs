# Decouverte d'AfroCodeurs par les moteurs et assistants

## Ce qui change

- Les pages publiques ne demandent plus le cookie de l'enigme. L'enigme protege
  uniquement l'arrivee sur `/register` ; une resolution conduit a l'inscription.
  Meme reponse pour les humains et les robots : aucun contournement par user-agent.
- Les controles Auth.js, les permissions et les controles d'appartenance au chat
  restent obligatoires. Le chat communautaire n'est plus charge depuis la base
  lors d'une visite anonyme ou par un non-membre.
- Accueil explicite et page `/a-propos` en HTML serveur : communaute tech africaine,
  panafricaine et diaspora, entraide, open source, mentorat et projets deployes.
  Un resume anglais ne pretend pas que toute l'interface est traduite.
- Titres, descriptions, URL canoniques et apercus sociaux par rubrique et par
  fiche publique. Les pages paginees ont une URL canonique de pagination.
- Image de partage PNG 1200 x 630 a `/opengraph-image`.
- Les noms, resumes et liens des projets Constellation sont presents dans le
  HTML serveur, meme avant JavaScript. La nuee interactive prend ensuite le relais.
- Donnees structurees Organization, WebSite et AboutPage avec les vraies
  coordonnees et liens du projet. Pas d'avis, effectifs ou notes inventes.
- Sitemap : rubriques, contenus publics et dates reelles de modification.
  Pas de brouillons, fiches Constellation en attente/suspendues, demandes privees,
  messages ou espace d'administration. Pas de date artificiellement rafraichie
  a chaque requete sur les pages statiques.
- `robots.txt` autorise les moteurs, dont OAI-SearchBot, et exclut les espaces
  prives et pages utilitaires. Les pages de compte et creation sont `noindex`.
  `robots.txt` et `noindex` ne remplacent jamais une autorisation d'acces.

## Configuration apres fusion et deploiement

1. Verifier `NEXT_PUBLIC_SITE_URL=https://afrocodeurs.org`. Cette origine doit
   rester unique ; les variantes de domaine et HTTP doivent etre redirigees
   vers l'origine choisie par le proxy d'hebergement.
2. Verifier anonymement HTTP 200 pour `/`, `/a-propos`, `/communities`,
   `/robots.txt`, `/sitemap.xml` et l'image de partage. `/register` doit encore
   rediriger vers l'enigme sans son cookie, puis etre accessible apres resolution.
3. Dans Google Search Console, ajouter la propriete du domaine et valider le
   TXT DNS fourni par Google. Alternative pour une propriete prefixe d'URL :
   definir `GOOGLE_SITE_VERIFICATION` avec le jeton meta fourni. Aucun jeton
   n'est invente ni valide automatiquement par cette PR.
4. Faire la meme verification dans Bing Webmaster Tools ; le jeton meta
   facultatif est `BING_SITE_VERIFICATION`. Les jetons meta ne sont pas des
   identifiants de connexion et sont destines a etre publics.
5. Soumettre `https://afrocodeurs.org/sitemap.xml` dans ces consoles, puis
   inspecter l'accueil, la presentation et les rubriques principales. Ne pas
   utiliser une API d'indexation reservee a d'autres types de contenu.
6. Verifier que CDN/WAF ne renvoie pas de CAPTCHA aux visiteurs des pages
   publiques. Ne pas desactiver les protections globales ; diagnostiquer les
   blocages avec les outils d'inspection et les adresses de robots officielles.
7. Suivre les pages indexees, erreurs de couverture et requetes de recherche.
   Publier regulierement des ressources et des projets authentiques, et relier
   les pages depuis les canaux officiels de la communaute.

## IA : limites et politique

Les bonnes pratiques SEO restent la base des experiences IA de Google.
OAI-SearchBot sert la recherche dans ChatGPT ; GPTBot concerne un autre usage,
lie a l'entrainement. Cette PR ne cree pas de regle specifique GPTBot ni de
programme d'entrainement. Elle ne promet ni indexation, ni classement, ni citation.
Un fichier `llms.txt` n'est pas une condition d'indexation Google : la priorite
est du contenu public, lisible et fidele a la communaute, pas un fichier magique.

Sources officielles :
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.openai.com/api/docs/bots

Le sitemap est actuellement borne a 2 000 fiches par famille de contenu.
Prevoir des sitemaps pagines avant de depasser cette taille pour une famille.
La validation externe des proprietes et la recette sur le domaine de production
restent a effectuer apres deploiement.
