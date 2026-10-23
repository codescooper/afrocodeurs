# Chat : choix des discussions, presence et bulles

## Comportement

- Le bouton Chat ouvre le choix : chat general, membres en ligne puis hors ligne. Recherche par nom ou pseudo ; pagination des membres hors ligne.
- La section repliable "Conversations recentes" permet de retrouver aussi un groupe ou salon dont la bulle a ete fermee, sans quitter la page.
- Le contact ouvre une fenetre compacte sans quitter la page. Une presence en ligne n'est pas necessaire pour laisser un message. Les membres presentes ont un email confirme.
- La croix d'une bulle ou de sa fenetre ferme l'affichage sans supprimer les messages, sans quitter un groupe et sans modifier les adhesions.
- Une bulle fermee reste masquee dans cet onglet, y compris apres actualisation. Elle reapparait pour un nouveau message entrant non lu, ou lorsque le membre ouvre lui-meme la discussion. Les donnees de fermeture (identifiant/date) sont stockees en sessionStorage, separees par compte ; jamais le texte des messages ou brouillons.
- Reduire conserve la fenetre et le brouillon. Fermer termine la fenetre et abandonne son brouillon, comme valide avec le mainteneur.

## Presence et confidentialite

Un signal d'activite est envoye au plus toutes les 30 secondes, seulement sur un onglet visible et si une interaction recente a ete detectee. La presence expire apres deux minutes. Une fermeture brutale ou une coupure reseau peut donc laisser un membre indique en ligne pendant ce delai ; ce n'est pas une preuve de disponibilite.

`ChatPresence` conserve seulement la derniere activite par membre, sans historique, geolocalisation ni adresse IP. La liste exige une connexion, exclut le compte courant et ne renvoie ni email ni date/heure exacte d'activite. Le point de presence n'accepte pas d'identifiant de membre fourni par le navigateur.

Les statuts sont interroges toutes les 15 secondes quand le panneau est ouvert. Il ne s'agit pas d'une connexion WebSocket. Les garde-fous d'authentification et de verification email restent actifs ; les creations de discussion et signaux de presence sont limites en frequence.

## Verification

Le 23 octobre 2026, deux comptes dedies `qa_chat_*`, de role USER, ont ete provisiones pour un echange uniquement entre eux sur la production deja deployee. Connexion normale par Auth.js/CSRF, sans emprunter de session d'un membre reel : A vers B, compteur non lu a 1, lecture ramenant le compteur a 0, reponse B vers A et reception par interrogation incrementale reussis. Aucun membre reel sollicite. Mots de passe aleatoires non publies, acces par mot de passe et verification email retires en fin de recette ; les donnees de test sont identifiables.

Ces essais production valident l'envoi/reception existants, pas la nouvelle interface non encore deployee. La nouvelle presence et l'ouverture d'un membre hors ligne sont testees avec les vrais Route Handlers et PostgreSQL sur une base isolee ; tests DOM pour le panneau, tests de fermeture/reapparition et de concurrence des discussions directes.

## Livraison

Migration additive `20261023060000_add_chat_presence` a appliquer avant la nouvelle image web. Revue et fusion avant deploiement ; conserver les volumes, la sauvegarde DB et les correctifs d'inscription serveur. La migration peut rester en place si l'ancienne image doit etre restauree.

Recette apres livraison : deux membres volontaires visibles en ligne, expiration apres inactivite, contact hors ligne joignable, croix de fermeture, actualisation sans reapparition intempestive, nouveau message entrant faisant revenir la bulle, reduction/navigation conservant le brouillon. Ne pas contacter de membre reel sans accord.
