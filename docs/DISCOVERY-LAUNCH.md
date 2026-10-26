# Decouverte, participation et retour des membres

## Livre dans le site, en attente de fusion et de deploiement

- Presentation publique et SEO : voir SEO-DISCOVERY.md.
- `/participer` : cinq parcours concrets, distinction open source / produits
  deployes, contribution GitHub, contact pour partenariats. Sans compte requis.
- Lien permanent dans le pied de page et presence dans le sitemap.
- Controle anonyme reproductible :

```sh
node scripts/check-public-discovery.mjs https://afrocodeurs.org
node --test scripts/check-public-discovery.test.mjs
```

Le premier controle doit etre execute APRES chaque deploiement : un code non nul
bloque l'annonce de lancement. Il controle HTTP, contenu, noindex et redirection
d'inscription. Il ne prouve ni indexation Google ni bon fonctionnement complet.
Completer dans un navigateur mobile et desktop : inscription avec erreur puis
succes, image de partage, navigation clavier, projet public, aucune fuite de
messages prives. Ne jamais utiliser des membres reels comme comptes de test.

## Actions externes restant a executer

| Action | Responsable | Preuve attendue |
| --- | --- | --- |
| Verifier domaine Search Console et Bing | Proprietaire du domaine | Proprietes validees et sitemap accepte |
| Verifier apercus WhatsApp/LinkedIn | Equipe plateforme | Titre, image et lien corrects sur une fiche publique |
| Completer sujets, description et lien du depot GitHub | Mainteneur | Depot public coherent avec le site |
| Publier une ressource et presenter un projet reel chaque semaine | Equipe editoriale et membres volontaires | Liens publics relus, accord des personnes mises en avant |
| Contacter trois clubs/communautes pilotes | Animation | Besoin identifie, interlocuteur volontaire, prochaine rencontre |
| Tester anglais, mobile et connexion lente | Produit et volontaires | Difficultes consignees avant promesse de couverture panafricaine |

Aucune de ces operations externes n'est pretendue terminee par l'ajout de ce fichier.
Les annonces, invitations et modifications de comptes externes demandent une
execution explicite ; aucun envoi automatique ni ajout de membres a une liste.

## Premiere boucle editoriale de quatre semaines

1. Inviter quelques membres volontaires a presenter un projet deploye ou une
   difficulte concrete ; les aider a remplir une fiche utile et relue.
2. Mettre en avant un projet et une piste precise de contribution, avec accord
   du porteur. Pointer vers sa fiche, pas seulement vers l'accueil.
3. Organiser un echange autour d'une question recurrente et publier une ressource
   issue des reponses, en citant ses contributeurs avec leur accord.
4. Recontacter uniquement les participants qui le souhaitent : ce qui les a aides,
   ce qui les a bloques, et la prochaine collaboration qu'ils veulent mener.

Pas de faux temoignages, chiffres inventes, annuaires de pays vides, achat de
liens, collecte d'adresses ou diffusion massive. Aucun engagement de classement.

## Mesurer l'utilite avant le trafic

Relever chaque semaine, sous forme agregee : inscriptions reussies/erreurs,
premieres contributions, contributions ayant recu une reponse, membres revenus
contribuer et collaborations acceptees. Ecrire les definitions avant de comparer
les semaines ; une visite n'est ni une personne unique ni une contribution.

Les consoles des moteurs mesurent les requetes et clics de recherche. Pour les
autres canaux, commencer par un retour volontaire des membres. Aucun outil de
tracking, pixel, cookie analytique ou transmission externe ajoute par ce lot.
Si une mesure automatisee devient necessaire, definir d'abord minimisation,
retention, acces, information des membres et base legale adaptee.

## Retour et confiance

Verifier les preferences de notifications/digest existantes, la desinscription,
les liens de retour et le traitement des signalements. Ne pas activer de nouvelles
notifications promotionnelles par defaut. Donner une reponse humaine aux premieres
contributions ; eviter de promettre un delai sans equipe disponible.
