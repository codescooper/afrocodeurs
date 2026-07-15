# Réussir la bêta contrôlée d'AfroCodeurs

Ce guide transforme la bêta en une expérience limitée, mesurable et sûre. Le
but n'est pas de faire du bruit : il est de vérifier que de vraies personnes
comprennent AfroCodeurs, réussissent les parcours essentiels et reviennent.

## 1. Définition de la réussite

La bêta est réussie si elle démontre ces trois choses :

1. **Activation** : une personne invitée crée son compte, vérifie son email,
   complète son profil et comprend quoi faire ensuite.
2. **Valeur** : elle publie ou enrichit au moins un problème, une ressource, une
   solution, une réponse ou un projet.
3. **Rétention** : elle revient dans les sept jours sans relance individuelle.

La métrique principale est :

> **Pourcentage de bêta-testeurs ayant réalisé une contribution utile dans les
> 48 heures suivant leur inscription.**

Objectifs indicatifs pour une première bêta de 20 personnes :

| Indicateur | Cible minimale |
|---|---:|
| Invitation → compte vérifié | 70 % |
| Compte vérifié → profil complété | 60 % |
| Une contribution utile sous 48 h | 40 % |
| Retour spontané à J+7 | 25 % |
| Parcours critiques sans erreur bloquante | 95 % |
| Incident critique non résolu après 24 h | 0 |

Ces seuils servent à décider, pas à embellir un bilan. Un échec mesuré est plus
utile qu'un lancement public prématuré.

## 2. Portes obligatoires avant la première invitation

Ne pas inviter de testeur externe tant que ces cases ne sont pas cochées :

- [ ] Un domaine public est configuré et pointe vers la production.
- [ ] Le domaine d'envoi est vérifié dans Resend.
- [ ] L'inscription, la vérification d'email et le mot de passe oublié ont été
  testés avec au moins deux fournisseurs externes, par exemple Gmail et Outlook.
- [ ] L'identité de l'éditeur et du directeur de publication est renseignée
  dans les pages légales.
- [ ] `contact@`, `privacy@`, `abuse@` et `conduct@` arrivent dans des boîtes
  réellement surveillées.
- [ ] Une sauvegarde de la base de production existe et sa restauration est
  documentée.
- [ ] Une personne est désignée responsable de la bêta et une autre peut prendre
  le relais en cas d'indisponibilité.
- [ ] Le canal de retour est prêt et son lien est envoyé avec chaque invitation.
- [ ] La procédure « pause des invitations » est connue de l'équipe.

Pourquoi l'email est bloquant : AfroCodeurs autorise la connexion d'un compte
non vérifié, mais exige un email vérifié pour publier. Sans livraison réelle,
les testeurs rencontreraient un faux blocage produit dès leur première action.

## 3. Constituer la bonne cohorte

Commencer petit et augmenter uniquement après observation.

### Vague 0 — équipe interne, 3 à 5 personnes

Durée : 2 jours. Objectif : éliminer les blocages évidents et valider le support.

### Vague 1 — cercle de confiance, 10 à 15 personnes

Durée : 7 jours. Recruter des personnes qui accepteront de décrire précisément
leurs difficultés, pas seulement de dire « c'est bien ».

### Vague 2 — bêta élargie, 20 à 30 personnes

Durée : 7 à 14 jours. N'ouvrir cette vague que si aucun incident critique n'est
ouvert et si les parcours essentiels dépassent 95 % de réussite.

La cohorte doit mélanger :

- étudiants et autodidactes ;
- développeurs, designers et profils non techniques qui documentent des
  problèmes ;
- francophones et anglophones ;
- plusieurs pays et qualités de connexion ;
- mobile Android, iPhone et ordinateur ;
- personnes familières avec GitHub et personnes qui ne le sont pas.

Éviter les centaines d'inscriptions. Trente retours suivis valent davantage que
trois cents comptes silencieux.

## 4. Préparer chaque testeur

Chaque invitation contient :

1. la raison personnelle de l'invitation ;
2. la durée de la bêta et le temps demandé, environ 30 minutes puis 5 minutes à
   J+2 et J+7 ;
3. le lien unique vers la plateforme ;
4. trois missions maximum ;
5. le canal de retour et le contact d'urgence ;
6. un rappel de ne pas publier de donnée personnelle ou confidentielle ;
7. l'autorisation demandée pour recontacter la personne au sujet de ses retours.

Exemple court :

> Tu fais partie d'un petit groupe qui teste AfroCodeurs avant son ouverture.
> Crée ton compte, complète ton profil et réalise les trois missions indiquées.
> Dis-nous immédiatement ce qui bloque ou ce qui n'est pas clair. Nous testons
> le produit, pas tes compétences.

## 5. Les parcours à faire tester

Ne pas expliquer où cliquer avant le test. Observer d'abord si l'interface se
comprend seule.

### Parcours A — première activation

- créer un compte ;
- résoudre Turnstile et le PoW ;
- recevoir et ouvrir l'email de vérification ;
- compléter le profil et ajouter au moins une compétence ;
- retrouver son profil public.

### Parcours B — du problème à la contribution

- trouver un problème réel dans Explorer ;
- comprendre les solutions et ressources déjà liées ;
- ajouter une ressource, une solution ou un commentaire utile ;
- retrouver la contribution sur son profil.

### Parcours C — entraide

- rejoindre une communauté ;
- poser une question ou répondre à une question existante ;
- voter et comprendre la réponse acceptée ;
- vérifier la réception d'une notification dans l'application.

### Parcours D — construction open source

- ouvrir un projet ;
- comprendre sa progression et son graphe de dépendances ;
- identifier une tâche prête ;
- atteindre l'issue GitHub correspondante.

### Parcours E — confiance et récupération

- enregistrer un contenu dans les favoris ;
- modifier une préférence de notification ;
- se déconnecter puis se reconnecter ;
- tester le mot de passe oublié sur un compte prévu à cet effet ;
- signaler un contenu de test convenu avec l'équipe.

## 6. Collecter des retours exploitables

Pour chaque problème, demander exactement :

- page ou action concernée ;
- résultat attendu ;
- résultat observé ;
- étapes permettant de reproduire ;
- appareil, navigateur et qualité de connexion ;
- capture d'écran si elle ne contient aucune donnée sensible ;
- fréquence : toujours, parfois ou une seule fois.

Classer chaque retour :

| Niveau | Définition | Réponse attendue |
|---|---|---|
| P0 | Fuite de données, sécurité ou service indisponible | Pause immédiate de la bêta |
| P1 | Inscription, connexion, publication ou récupération bloquée | Diagnostic immédiat, correction sous 24 h |
| P2 | Fonction importante dégradée avec contournement | Planifier dans la vague en cours |
| P3 | Incompréhension, friction ou amélioration | Regrouper par thème et fréquence |

Ne pas transformer chaque opinion en fonctionnalité. Chercher les motifs : trois
personnes bloquées au même endroit signalent un problème ; une préférence isolée
est une piste.

## 7. Rythme quotidien de l'équipe

Pendant la bêta, tenir un point de 20 minutes chaque jour :

1. production et crons sont-ils en ligne ?
2. combien d'invitations, comptes vérifiés, profils et contributions ?
3. quels P0/P1 sont ouverts ?
4. quelles frictions reviennent au moins trois fois ?
5. quelle est l'unique correction prioritaire du jour ?
6. peut-on inviter la vague suivante ?

À la fin de la journée, mettre à jour `STATUS.md` avec les faits et la prochaine
action unique.

## 8. Tableau de suivi minimal

Utiliser un tableur sans y copier de mot de passe, token ou contenu privé.

| Champ | Exemple |
|---|---|
| Identifiant testeur | `BETA-012` |
| Persona / pays | Étudiante développeuse / Sénégal |
| Appareil | Android, connexion 4G |
| Invitation envoyée | date |
| Email vérifié | oui/non |
| Profil complété | oui/non |
| Première contribution | type + date |
| Retour à J+2 / J+7 | oui/non |
| Blocage principal | résumé sans donnée sensible |
| Satisfaction | note de 1 à 5 + phrase libre |

## 9. Procédure en cas d'incident

Pour un P0 ou plusieurs P1 simultanés :

1. arrêter les nouvelles invitations ;
2. annoncer clairement l'incident aux testeurs concernés ;
3. conserver les journaux utiles sans exposer de secret ;
4. identifier la dernière révision saine ;
5. corriger ou redéployer cette révision ;
6. vérifier inscription, connexion, publication et base de données ;
7. documenter la cause, l'impact et la prévention ;
8. reprendre les invitations seulement après validation par deux personnes.

Ne jamais modifier manuellement les données de production sans sauvegarde et
sans noter exactement l'opération réalisée.

## 10. Décision à la fin de chaque vague

### Continuer

- aucun P0 ;
- aucun P1 ouvert depuis plus de 24 heures ;
- au moins 95 % des parcours critiques aboutissent ;
- l'équipe répond aux retours dans le délai annoncé ;
- les testeurs comprennent la proposition de valeur sans explication longue.

### Prolonger la vague

- les données sont insuffisantes ;
- l'activation est faible mais la cause semble corrigeable ;
- plusieurs frictions P2 reviennent ;
- la rétention J+7 n'est pas encore mesurable.

### Arrêter et corriger

- incident de sécurité ou perte de données ;
- inscription, vérification d'email ou publication instable ;
- équipe incapable de traiter les retours ;
- proposition de valeur incomprise par la majorité.

## 11. Passage au lancement public

Le lancement public devient raisonnable quand :

- [ ] deux vagues consécutives respectent les seuils ;
- [ ] aucun P0/P1 n'est ouvert ;
- [ ] email, récupération de compte et modération sont vérifiés ;
- [ ] pages légales et adresses de contact sont complètes ;
- [ ] sauvegarde et procédure de restauration sont testées ;
- [ ] stockage média persistant configuré, ou upload clairement désactivé ;
- [ ] une surveillance d'erreurs est active ;
- [ ] l'équipe sait qui répond au support pendant les sept premiers jours ;
- [ ] le contenu fondateur suffit pour qu'un nouveau membre trouve une action
  utile sans accompagnement.

## Checklist du premier jour

- [ ] Tester soi-même inscription → email → profil → contribution.
- [ ] Vérifier Railway, PostgreSQL et la dernière CI.
- [ ] Envoyer seulement les cinq invitations de la vague 0.
- [ ] Confirmer la réception de chaque email.
- [ ] Observer les tests sans guider prématurément.
- [ ] Centraliser les retours et attribuer leur priorité.
- [ ] Envoyer un bilan court à l'équipe en fin de journée.
