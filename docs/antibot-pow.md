# De la recherche au code : un anti-bot par preuve de travail

> **Pour qui ?** Tout vibe codeur qui veut apprendre à **transformer une recherche
> en code utile** — pas seulement copier-coller une lib. On prend un vrai papier
> (Hashcash, Adam Back, 1997), on en extrait l'idée, et on l'implémente dans une
> vraie plateforme. Le code décrit ici vit dans ce dépôt.

## 1. Le problème (le tien aussi, sûrement)

Dès qu'une app a un endroit public où l'on peut **écrire** — créer un compte,
commenter, contacter, poster — des robots viennent en abuser : faux comptes,
spam, saturation. Sur AfroCodeurs, l'inscription **écrit en base** et **envoie un
email** : un script peut en créer des milliers en quelques secondes.

Le réflexe « vibe coding » : coller un CAPTCHA Google/Cloudflare. Ça marche, mais
ça : dépend d'un tiers, envoie des données de tes visiteurs ailleurs, ne tourne
pas en local, et… **se fait battre par l'IA en 2026** (les modèles résolvent les
images mieux que les humains).

Et si la recherche avait déjà résolu ça, autrement, il y a 25 ans ?

## 2. La méthode (l'essentiel à retenir)

C'est ça, la compétence à acquérir — applicable à n'importe quel problème :

| Étape | Ce qu'on fait | Sur notre cas |
|------|----------------|----------------|
| **0. Sentir** | « Ce problème a sûrement été étudié. » | Le spam est vieux comme le mail. |
| **1. Chercher** | Mots-clés + sources sérieuses (Google Scholar, Wikipedia → bibliographie, blogs d'experts). | « anti-spam proof of work » → *Hashcash*. |
| **2. Extraire le noyau** | Une phrase. Ignore le reste. | **Produire coûte cher, vérifier est gratuit.** |
| **3. Prototyper le noyau** | Le plus petit code qui prouve l'idée, isolé. | Une fonction qui cherche un `nonce`. |
| **4. Intégrer** | Proprement, sans casser, désactivable. | Branché sur l'inscription, gated par env. |
| **5. Mesurer & calibrer** | Régler avec des chiffres réels. | Difficulté en bits → temps mesuré. |

> 🔑 Le piège du vibe coding, c'est de sauter de l'étape 0 à « installe une lib ».
> Les étapes 1–2 (lire, extraire l'idée) sont là où tu deviens *meilleur* que la
> moyenne — parce que tu comprends *pourquoi* ça marche.

## 3. L'idée de Hashcash (étape 2, en clair)

Adam Back, 1997 : pour envoyer un message, ton ordinateur doit d'abord résoudre
un petit casse-tête calculatoire. L'astuce est une **asymétrie** :

- **Produire** la preuve = trouver un nombre (`nonce`) tel que
  `SHA-256(challenge:nonce)` commence par `D` zéros binaires. Il n'y a pas de
  raccourci : il faut essayer ~`2^D` valeurs. Coûteux.
- **Vérifier** la preuve = **un seul hash**. Quasi gratuit.

```
Humain, 1 inscription   →  ~1 seconde, invisible
Robot, 1 000 000 spams  →  ~11 jours de CPU non-stop
```

Le bot n'est pas *bloqué* — il est rendu **trop cher**. Et on ne cherche jamais à
deviner « est-ce un humain ? » : on facture le **volume**. C'est pour ça que l'IA
n'y change rien.

## 4. Le code réel (étapes 3–4)

Tout est cartographié ici — ouvre les fichiers en parallèle de ce texte :

| Fichier | Rôle |
|--------|------|
| [`lib/pow.ts`](../lib/pow.ts) | Le noyau serveur : `issueChallenge()` (émet un défi signé), `verifyPoW()` (vérifie en O(1)), `solveChallenge()` (force brute, pour les tests). |
| [`public/pow-worker.js`](../public/pow-worker.js) | Le solveur **navigateur** (Web Worker) : SHA-256 pur, tourne hors du thread UI pour ne pas figer la page. |
| [`features/auth/pow-widget.tsx`](../features/auth/pow-widget.tsx) | Le widget client : demande un défi, le résout, injecte la preuve dans le formulaire. |
| [`app/api/pow/route.ts`](../app/api/pow/route.ts) | L'endpoint qui émet un défi frais. |
| [`features/auth/actions.ts`](../features/auth/actions.ts) | L'intégration : `verifyPoW()` est appelé **avant** le bcrypt / l'écriture DB / l'email. |
| [`app/(public)/labs/pow/page.tsx`](../app/(public)/labs/pow/page.tsx) | Une démo interactive : `/labs/pow` (à voir tourner !). |
| [`test/pow.test.ts`](../test/pow.test.ts) | Les tests — dont la preuve que le SHA-256 du **navigateur** = celui du **serveur**. |

### Trois décisions de conception qui font la différence

1. **Défi sans état (stateless).** Le serveur ne stocke rien : le défi est
   `salt:exp:difficulty:` **signé en HMAC** avec un secret. La signature prouve
   plus tard qu'il vient bien de nous. Zéro table, zéro session.
2. **Désactivé par défaut (gated/no-op).** Sans `POW_ENABLED="true"`, `verifyPoW`
   renvoie « ok ». On peut donc merger sans rien casser, et l'allumer en prod par
   une variable d'env — exactement comme le CAPTCHA Turnstile déjà présent.
3. **Vérifier avant de dépenser.** On valide la preuve **avant** le bcrypt et
   l'envoi d'email, jamais après — sinon le bot te coûte cher quand même
   (*denial-of-wallet*).

## 5. Mesurer & calibrer (étape 5)

La difficulté `D` se règle en **bits** (`POW_DIFFICULTY`). Repère ~1 M hash/s
dans un navigateur moderne :

| D | Coût humain | Usage |
|---|-------------|-------|
| 16 | ~40 ms | actions fréquentes |
| 18 | ~250 ms | **défaut** |
| 20 | ~1 s | inscription / login |
| 22 | ~4 s | sous attaque |

Va sur **`/labs/pow`**, lance en 12 puis en 22 bits : tu *sens* la courbe
exponentielle. Règle simple — commence bas, **mesure**, monte si l'abus persiste.

## 6. Pourquoi c'est le bon choix en 2026

- **L'IA a tué les CAPTCHA classiques.** Deviner « humain ou bot » est perdu
  d'avance. Le PoW ne devine rien : il facture le calcul. Intouchable par l'IA.
- **Souveraineté & vie privée.** Aucun tiers, aucune donnée visiteur envoyée
  ailleurs, RGPD-friendly, marche même en local / hors-ligne.
- **Gratuit.** ~150 lignes, pas d'abonnement.
- **Intemporel.** Ça ne repose pas sur une ruse qui se périme, mais sur une loi :
  *calculer coûte, vérifier est gratuit*. Le même principe fait tourner Bitcoin.
  Vrai en 1997, vrai en 2026.

## 7. Les limites (à connaître, pas à cacher)

- **Anti-rejeu obligatoire** : un `salt` n'est accepté qu'une fois (sinon le bot
  résout une fois et rejoue la preuve). En mémoire ici → OK en mono-instance ;
  en serverless multi-instances, brancher un store partagé (Redis `SETNX`).
- **Difficulté signée** : `D` est dans le HMAC → impossible pour le client de
  l'abaisser (downgrade).
- **Le PoW n'authentifie pas** : il décourage l'abus *de masse*. On garde le
  rate-limiting et l'auth à côté. Les couches se cumulent.
- **Accessibilité** : si une fraction d'utilisateurs n'exécute pas le Worker
  (JS coupé), prévoir un repli (file de modération, CAPTCHA de secours).

## 8. L'activer ici

```bash
# .env (production)
POW_ENABLED="true"
NEXT_PUBLIC_POW_ENABLED="true"
POW_DIFFICULTY="20"        # ~1 s, adapté à l'inscription
# AUTH_SECRET est déjà là : il sert aussi à signer les défis.
```

En dev, on laisse vide → invisible, rien à calculer.

## 9. L'appliquer à TES autres projets

La technique est intemporelle → elle a été empaquetée en commande réutilisable :

```
/awema-antibot-pow            # détecte si ça s'applique, puis implémente ou explique pourquoi pas
/awema-antibot-pow --check    # diagnostic seul, sans rien modifier
```

Elle est **stack-agnostique** (Next, Laravel, FastAPI, Go…) : elle lit ton
projet, repère tes surfaces publiques, et — si c'est pertinent — pose le même
noyau adapté à ta techno. Sinon, elle te dit pourquoi et quoi faire à la place.

---

### Sources
- Adam Back, *Hashcash — A Denial of Service Counter-Measure* (2002) ; annonce
  originale sur la liste cypherpunks (1997). Voir `hashcash.org`.
- Le concept de « preuve de travail » réutilisé ensuite par RPOW (Hal Finney,
  2004) puis Bitcoin (Nakamoto, 2008).
- Implémentations modernes du même principe : mCaptcha, Friendly Captcha, Anubis.
