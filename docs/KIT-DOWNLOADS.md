# Kit IA : téléchargement et suivi

Version du 25 novembre 2026. Page publique : `/kits/premier-agent-ia` ; sources autorisées `mail`, `article`, `direct` et `test` (paramètre `source`). Aucune URL individualisée par destinataire.

Le ZIP de 238 617 octets est versionné dans `resources/` et inclus au déploiement. Son SHA-256 attendu est `21ea0b7703553e1df44474b8372bd60bf4d9423513a18ecdd195b902f035260a`. Il reste disponible après redéploiement, sans dépendre du disque d’upload éphémère. Ce fichier est le kit AfroCodeurs et conserve sa propre notice de droits ; le versionnement n’en modifie pas la licence.

Le bouton envoie un POST de même origine à `/api/kits/premier-agent-ia`. GET redirige vers la page et HEAD ne compte rien, pour limiter les faux téléchargements des aperçus de mails. L’enregistrement SERVED signifie que le serveur a préparé et retourné le fichier, sans prouver sa réception complète ou son utilisation. Les robots et demandes répétées restent possibles. Le service renvoie 503 si le fichier ou la persistance du suivi est indisponible. Les erreurs d'accès au fichier sont enregistrées si la base fonctionne ; une panne de la base ne peut pas y être enregistrée.

Le journal enregistre date, statut, campagne autorisée, origine du référent (aucun chemin/paramètre), navigateur et OS normalisés, type d’appareil approximatif, indicateur de robot, taille, empreinte du fichier. Il ne conserve ni IP, email, utilisateur connecté, cookie analytique, identifiant individuel ni user-agent brut. Les en-têtes sont déclaratifs. Aucun accès à la progression locale du kit.

Administration : `/admin/downloads` et CSV `/api/admin/kit-downloads`, réservés au rôle ADMIN par permission `system:manage`. Affichage 200 événements récents, export 10 000 maximum, statistiques sur 90 jours. Les données anciennes sont masquées puis purgées au prochain téléchargement. Les exports doivent rester privés.

Notification interne à `codescooper@gmail.com`, au maximum une par minute (verrou transactionnel Postgres), hors tests et robots reconnus. Tous les événements apparaissent dans le tableau même lorsqu’une notification est regroupée. Pas d’email ou push navigateur supplémentaire. Une panne de notification est journalisée sans bloquer le fichier.

Recette production : appliquer la migration avec le mécanisme Railway existant ; ouvrir la page avec `?source=test`, télécharger une fois, comparer empreinte/taille, vérifier l’événement test dans l’administration. Télécharger ensuite normalement et vérifier la notification. Vérifier que les visiteurs et membres sans rôle ADMIN ne peuvent pas lire le journal ni le CSV. Mettre à jour l’article et envoyer le mail seulement après cette recette. Ne pas inclure les emails des membres dans ce dépôt.
