# Livraison des correctifs Constellation

## Ordre de livraison

1. Fusionner le correctif des avatars, puis celui de fiabilisation Constellation.
2. Construire une nouvelle image depuis le SHA fusionne. Conserver l'image precedente et sauvegarder la configuration de deploiement sans afficher ses secrets.
3. Sur le compose de production externe au repo, modifier ensemble le port du service web : `PORT=3000`, cible du mapping `127.0.0.1:14190:3000`, port cible du proxy et URL du healthcheck `http://127.0.0.1:3000/api/health`. Le port hote 14190 reste inchange. Ne pas modifier les volumes ni la base.
4. Recreer seulement le service web avec la nouvelle image. Aucun changement de schema pour ce lot.
5. Verifier la sante application/base, une navigation avec redirection apres action, une photo existante et un nouvel upload sans redemarrage.
6. Tester les bulles avec photo, sans photo et URL cassee ; verifier les compteurs non rognes. Soumettre une fiche avec une erreur serveur : les textes et selections doivent rester. Une fiche en attente ne doit pas proposer le partage public.

## Pourquoi changer de port

Le port interne 4190 est reserve a Sieve et bloque par Fetch. Next utilise Fetch pour certaines redirections de Server Actions : les logs de production contiennent `failed to get redirect response` avec `bad port`. Utiliser le port HTTP habituel 3000, sans desactiver les protections Fetch.

## Retour arriere

En cas d'echec des controles, restaurer ensemble l'image precedente et sa configuration de ports sauvegardee, puis recreer uniquement le web. Ne pas supprimer les volumes d'uploads ou PostgreSQL. Les corrections d'inscription presentes hors Git sur le serveur doivent etre preservees et comparees avant construction.
