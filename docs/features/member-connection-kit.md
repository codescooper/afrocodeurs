# Kit de connexion des membres — MVP

Routes : `/kit-connexion` (guide), `/dashboard/sources` (authentifié/email vérifié pour modifier), `/members-feed` (public).

## Périmètre
- Ajout manuel ou connexion volontaire RSS/Atom/JSON Feed/GitHub releases publiques.
- Consentement distinct pour chaque source, aucune reprise automatique des liens profil.
- Import sur demande, 30 éléments max, 10 sources max par compte, déduplication URL canonique par membre.
- Aperçu privé, validation explicite, retrait public, suppression source avec ses entrées.
- Corps traités comme texte, liens externes nofollow/noopener.
- Import distant HTTPS/public seulement, contrôle DNS et IP épinglée, redirections validées, DTD interdites, 1 Mo, 10s.

## Déploiement
Faire sauvegarde DB vérifiée. Générer Prisma, appliquer migration additive `20261116040000_member_sources` en staging puis tests authentifiés avant production. Aucun email d'annonce avant confirmation production. Tables existantes préservées. Rollback applicatif possible sans supprimer les nouvelles tables.

## Limites explicites
Endpoint automatique GET /api/cron/member-sources (Authorization: Bearer CRON_SECRET), lot de 8 sources les plus anciennes, âgées de plus d’une heure. Planifier toutes les 15 minutes côté serveur ; aucune exécution automatique tant que ce cron n’est pas installé et vérifié. Pas de TikTok/LinkedIn scraping. Pas de publication automatique. Les imports répétés ne modifient pas un élément déjà examiné. Limiteur de débit existant en mémoire : pour plusieurs instances il faut un store partagé. Vérification email n'est pas preuve de propriété du domaine ; consentement et déclaration de droits demandés. Le réseau et les URL restent soumis aux protections SSRF.

## Recette obligatoire
1. Compte non vérifié interdit, compte B ne peut agir sur source/entrée A.
2. Une source publique crée seulement des aperçus privés.
3. Une seconde actualisation ne crée pas de doublons.
4. Publier fait apparaître l'élément public ; masquer le retire.
5. Retirer une source retire ses éléments et empêche une actualisation concurrente de les recréer.
6. Flux invalide, URL locale, redirection privée, DTD, dépassements taille/délai sont bloqués.
7. Vérifier desktop/mobile, double clic et retour navigateur.

Publication annoncée seulement après migration, build et recette réels.

## Planificateur serveur
Utiliser un timer système toutes les 15 min, `flock` pour éviter les chevauchements et header Bearer (jamais secret dans URL/log). Sources connectées seulement, lots bornés, conservation de l'erreur et date dernier contrôle. La fréquence par source dépend du nombre de sources en attente. Vérifier une exécution réelle et la création d'un aperçu privé avant annoncer l'automatisation.

### Accès aux anciennes publications
Le tableau de bord pagine toutes les fiches par 30, avec un tri stable (date de création puis identifiant). Les liens « Page précédente » / « Page suivante » permettent de retrouver et retirer également les publications anciennes, sans plafond de 100 fiches. Le comptage et les requêtes restent limités au propriétaire connecté ; une page hors limites est ramenée à une page existante.
