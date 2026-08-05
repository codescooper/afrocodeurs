# Organisms

Sections complètes et autonomes, capables de lire des données (Server
Component + `queries.ts` d'un module `features/<domaine>/`) et de composer
plusieurs molécules/atomes. Peuvent contenir un état complexe côté client
quand nécessaire (`"use client"`).

Exemples attendus : `ProblemGrid`, `ForumThread`, `NotificationBell`.

- `suggestions-rail.tsx` — rail contextuel des pages hub (communautés actives
  + AfroMakers à suivre), utilisé par `HubTemplate` sur `/explorer`.
