## Why

L'API NestJS (auth par cookie httpOnly + CRUD users) ne se teste aujourd'hui qu'avec Postman. Il manque un front minimal pour vérifier le flux d'authentification dans un navigateur réel, puis pour valider la mise en prod sur un VPS (Traefik + Let's Encrypt déjà en place). L'auth par cookie httpOnly impose des contraintes (CORS, sameSite, secure, état de session non lisible en JS) qu'un vrai client navigateur est le seul moyen d'éprouver.

## What Changes

- **Nouveau front de test** dans `./front` : React + Vite + react-router + React Query + Tailwind. Deux écrans : `/login` et `/users` (liste protégée). Client HTTP `fetch` avec `credentials: 'include'`, redirection sur 401, table users sans exposer le hash de mot de passe.
- **Topologie même-origine** : pas de CORS. En dev, proxy Vite `/api` → `http://localhost:3005`. En prod, Traefik route `/` → front (nginx static) et `/api` → api.
- **Retouches API** :
  - `app.setGlobalPrefix('api')` dans `main.ts` (toutes les routes passent sous `/api`).
  - **BREAKING (chemins)** : tous les endpoints existants changent de préfixe (`/auth/login` → `/api/auth/login`, `/user` → `/api/user`, etc.). Postman et tout client existant doivent être mis à jour.
  - JWT `expiresIn` `60s` → `1h` et cookie `maxAge` aligné à 1h (confort de test).
  - Réactiver `@UseGuards(AuthGuard)` sur `GET /user` : la liste devient réellement protégée (401 si non connecté). `RolesGuard`/ADMIN reste désactivé pour rester minimal.
  - Exclure `password` de la réponse de `GET /user` (l'entité entière, hash compris, fuite actuellement).
  - Nouvel endpoint `POST /auth/logout` qui efface le cookie (`clearCookie`), car un cookie httpOnly ne peut pas être supprimé côté JS.
  - Cookie `secure: true` quand `NODE_ENV=production`.
- **Docker** : service `front` ajouté en dev (Vite) et en prod (build → nginx static) avec labels Traefik (`/` → front, `/api` → api).

## Capabilities

### New Capabilities
- `test-frontend`: Application web minimale (login + liste des users) consommant l'API via cookie httpOnly, avec gestion de session et de l'expiration (401 → login).
- `same-origin-deployment`: Topologie de déploiement même-origine (proxy Vite en dev, Traefik par chemin en prod) qui élimine le besoin de CORS pour l'auth par cookie.

### Modified Capabilities
- `auth`: ajout de `POST /auth/logout`, allongement de l'expiration JWT/cookie à 1h, cookie `secure` conditionné à la prod, et préfixe global `/api` sur les routes d'auth.
- `user-management`: `GET /user` redevient protégé par `AuthGuard`, la réponse n'expose plus `password`, et les routes passent sous le préfixe `/api`.

## Impact

- **Nouveau code** : `front/` (app Vite complète), `front/Dockerfile`, config nginx.
- **API modifiée** : `api/src/main.ts` (préfixe global + secure conditionnel), `api/src/auth/auth.module.ts` (expiresIn), `api/src/auth/auth.controller.ts` (maxAge, logout, secure), `api/src/user/user.controller.ts` (guard), `api/src/user/user.service.ts` ou entité (exclusion password).
- **Infra** : `docker-compose.dev.yml` et `docker-compose.yml` (service front + labels Traefik).
- **Clients existants** : Postman / scripts doivent migrer vers le préfixe `/api`.
- **Aucune migration DB** ; pas de changement de schéma TypeORM.
