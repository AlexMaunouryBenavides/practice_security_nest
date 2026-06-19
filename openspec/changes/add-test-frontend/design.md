## Context

L'API NestJS expose une auth par **cookie httpOnly** (`access_token`, `sameSite: 'strict'`) et un CRUD users (TypeORM/MySQL, cache-manager, bcrypt). Elle se teste aujourd'hui uniquement via Postman. On veut un front navigateur minimal pour éprouver le flux d'auth réel, puis valider le déploiement VPS (Traefik + Let's Encrypt déjà configurés dans `docker-compose.yml`, l'API sur `api.mondomaine.com`).

Contraintes structurantes découvertes pendant l'exploration :
- **Pas de CORS** activé dans `main.ts`.
- **Cookie httpOnly** : le JS ne peut ni le lire ni le supprimer → l'état de session doit se déduire des réponses API (401/200), et le logout exige une route serveur.
- **Expiration 60s** (JWT + cookie) : impraticable pour tester à la main.
- `GET /user` a ses guards **commentés** (public) et `findAll()` renvoie l'entité **entière, hash de password compris**.

## Goals / Non-Goals

**Goals:**
- Front minimal (`/login` + `/users`) prouvant que l'auth par cookie fonctionne dans un navigateur.
- Topologie **même-origine** identique en dev et en prod → zéro CORS, cookie sans friction.
- Retouches API minimales pour rendre le test probant et sûr (guard, exclusion password, logout, expiration confortable, secure en prod).

**Non-Goals:**
- CRUD complet côté front (register/edit/delete) — hors périmètre, l'API les garde.
- `RolesGuard`/ADMIN — volontairement non activé (éviterait de devoir seed un admin).
- Refonte de l'auth (refresh tokens, rotation) — on allonge juste l'expiration.
- Design soigné/branding — Tailwind utilitaire suffit.

## Decisions

### D1 — Topologie même-origine (proxy en dev, Traefik par chemin en prod)
Front et API partagent une seule origine. **Dev** : proxy Vite `/api` → `http://localhost:3005`. **Prod** : Traefik route `/` → front (nginx static) et `/api` → api.
- *Pourquoi* : avec un cookie httpOnly, le même-origine élimine CORS, sameSite cross-site et les cookies tiers. Et dev == prod, donc tester le front teste le vrai chemin de prod.
- *Alternative écartée* : sous-domaines séparés (`app.` / `api.`) → impose `enableCors({credentials:true})`, `secure`/`sameSite` à régler finement, 2 routers/certs. Plus fragile pour un objectif de test.
- *Conséquence* : `app.setGlobalPrefix('api')` côté Nest pour que le routage par chemin résolve.

### D2 — Le front n'utilise que des chemins relatifs `/api/...`
Aucun host API en dur. Le même build marche derrière le proxy Vite et derrière Traefik.

### D3 — État de session déduit, pas lu
Le cookie httpOnly étant illisible, l'UI déduit la session : un `GET /api/user` qui renvoie 401 → non connecté → redirect `/login`. Pas de `/auth/me` ajouté (la liste protégée suffit pour ce périmètre minimal).
- *Alternative* : route `/auth/me`. Reportée — non nécessaire tant qu'on n'a qu'un écran protégé.

### D4 — Réactiver `AuthGuard` sur `GET /user` (sans `RolesGuard`)
Décommenter `@UseGuards(AuthGuard)`. Sans ça, la liste est publique et le login ne « garde » rien : le test d'auth serait vide de sens.

### D5 — Exclure `password` côté API, pas seulement masquer côté front
`ClassSerializerInterceptor` + `@Exclude()` sur `User.password` (ou un `select` explicite). Masquer seulement côté front laisserait fuiter le hash dans la réponse réseau.
- *Choix recommandé* : `@Exclude()` + `ClassSerializerInterceptor` global — couvre toutes les routes users d'un coup. Nécessite que les méthodes renvoient des instances de `User` (TypeORM `find`/`save` en renvoient déjà).

### D6 — Logout serveur (`POST /auth/logout` → `clearCookie`)
Seul moyen de supprimer un cookie httpOnly. Le bouton front l'appelle puis vide le cache React Query et redirige.

### D7 — Expiration portée à 1h
`signOptions.expiresIn: '1h'` + cookie `maxAge: 60*60*1000`. Confort de test. Reste court côté sécurité.

### D8 — Cookie `secure` conditionné à la prod
`secure: process.env.NODE_ENV === 'production'`. HTTPS en prod (Traefik/LE), HTTP en local.

### D9 — Stack & structure front
Vite + React + TypeScript, react-router (`/login`, `/users`), React Query (`QueryClientProvider` + Devtools), Tailwind. `apiClient` = wrapper `fetch` avec `credentials:'include'` qui throw une erreur typée sur réponse non-ok (401 distingué pour la redirection). Hooks : `useLogin`, `useLogout`, `useUsers`.

### D10 — Prod front = build statique servi par nginx
Image multi-stage (`node build` → `nginx:alpine` servant `dist/`), labels Traefik. nginx ne sert que des fichiers statiques + fallback SPA (`try_files ... /index.html`) ; il ne proxifie PAS `/api` (c'est Traefik qui route `/api` vers l'API au niveau du host).

## Risks / Trade-offs

- **Changement de préfixe `/api` = breaking pour Postman/clients existants** → Mitigation : documenté dans la proposition ; mise à jour des collections Postman en même temps.
- **`ClassSerializerInterceptor` global peut altérer d'autres réponses** (ex: `update`/`delete` renvoient des résultats TypeORM, pas des `User`) → Mitigation : vérifier que seules les routes renvoyant des `User` sont impactées ; sinon cibler l'interceptor au niveau du contrôleur user.
- **`synchronize: true` en prod** (hérité) → hors périmètre mais à signaler : risqué sur le VPS. Mitigation : note dans tasks, à traiter séparément.
- **sameSite:'strict'** peut bloquer le cookie sur navigation cross-site initiale → en même-origine (D1) non concerné ; à revérifier si on passe un jour en sous-domaines.
- **Routage Traefik `/api`** : il faut décider si Traefik strip le préfixe ou si l'API l'attend. On choisit *l'API attend `/api`* (D1) → pas de `stripprefix`, le router Traefik matche `PathPrefix(`/api`)` sans le retirer. Mitigation : tester le routage avant de déclarer la prod OK.

## Migration Plan

1. API : `setGlobalPrefix('api')`, expiration 1h, guard réactivé, `@Exclude` password + interceptor, `POST /auth/logout`, `secure` conditionnel. Lancer l'API, vérifier au Postman que tout répond désormais sous `/api`.
2. Front : scaffold Vite dans `./front`, configurer proxy `/api`, implémenter login + liste + logout. Tester en local contre l'API dev.
3. Docker dev : ajouter service `front` à `docker-compose.dev.yml`.
4. Docker prod : ajouter service `front` (build → nginx) + labels Traefik (`/` → front, `PathPrefix(/api)` → api) à `docker-compose.yml`.
5. Déployer sur le VPS, vérifier login → liste → logout en HTTPS.

**Rollback** : le front est additif (dossier `./front` + services Docker) ; le retirer n'affecte pas l'API. Les retouches API sont réversibles commit par commit (le préfixe `/api` est le seul changement à coordonner avec les clients).

## Open Questions

- Faut-il seed un user de test (script) pour pouvoir se connecter immédiatement, ou register manuel via Postman ? (penche pour un petit script/seed optionnel).
- `ClassSerializerInterceptor` global vs ciblé sur `UserController` — trancher à l'implémentation selon l'impact sur les autres réponses.
- Domaine/host exact côté Traefik pour le front (`mondomaine.com` ?) à fixer avant le déploiement VPS.
