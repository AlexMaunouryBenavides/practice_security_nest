## 1. Retouches API

- [x] 1.1 Ajouter `app.setGlobalPrefix('api')` dans `api/src/main.ts`
- [x] 1.2 Passer le cookie `secure` à `process.env.NODE_ENV === 'production'` dans `api/src/auth/auth.controller.ts`
- [x] 1.3 Allonger l'expiration : `signOptions.expiresIn: '1h'` dans `auth.module.ts` ET cookie `maxAge: 60 * 60 * 1000` dans `auth.controller.ts`
- [x] 1.4 Décommenter `@UseGuards(AuthGuard)` sur `GET /user` dans `api/src/user/user.controller.ts` (laisser `RolesGuard`/ADMIN désactivé)
- [x] 1.5 Exclure `password` des réponses : `select` explicite via `toPublicUser()` dans `user.service.ts` (allowlist `id`/`name`/`email`/`role`, gère aussi le cache ; `update`/`delete` inchangés). NB : `class-transformer` non installé, donc l'allowlist remplace `@Exclude`+`ClassSerializerInterceptor`.
- [x] 1.6 Ajouter `POST /auth/logout` dans `auth.controller.ts` → `res.clearCookie('access_token')` + message
- [x] 1.7 Vérifié en statique : `npm run build` OK, `eslint` 0 erreur sur les fichiers touchés. Vérif runtime Postman repliée dans le lot 5 (nécessite la DB lancée).

## 2. Scaffold du front

- [x] 2.1 Créer `./front` avec Vite (React + TypeScript) — `package.json`, `tsconfig.json`, `index.html`
- [x] 2.2 Installer et configurer Tailwind v4 (plugin `@tailwindcss/vite` + `@import 'tailwindcss'` dans `index.css`, pas de postcss/config)
- [x] 2.3 Installer `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-query-devtools`
- [x] 2.4 Configurer le proxy dans `vite.config.ts` : `/api` → `http://localhost:3005`
- [x] 2.5 Mettre en place `QueryClientProvider` + Devtools + le routeur dans `main.tsx`/`App.tsx` (queries `retry:false`)

## 3. Couche API client

- [x] 3.1 Créer `apiClient` (`src/api/client.ts`) avec `credentials: 'include'`, chemins relatifs `/api/...`, throw `ApiError` (status préservé) sur réponse non-ok
- [x] 3.2 Créer les hooks React Query (`src/api/hooks.ts`) : `useLogin`, `useLogout` (vide le cache), `useUsers`

## 4. Écrans

- [x] 4.1 Écran `/login` : formulaire email/password → `useLogin`, erreur 401 inline, redirect `/users` au succès
- [x] 4.2 Écran `/users` : `useUsers`, table (`id`, `name`, `email`, `role` — jamais `password`), états loading/error
- [x] 4.3 Garde de route : 401 sur `useUsers` → `<Navigate to="/login" />` (session déduite, D3)
- [x] 4.4 Bouton Logout : `useLogout` → vide le cache React Query + redirect `/login`

## 5. Vérification fonctionnelle locale

> **Lot 5 = vérification runtime à exécuter par l'utilisateur** (nécessite MySQL + API + front lancés). Build statique déjà vérifié (`api: npm run build` OK, `front: npm run build` OK).
- [ ] 5.1 Lancer la DB + API : `docker compose -f docker-compose.dev.yml up api mysql` (ou API en local + MySQL). Créer un user de test : `curl -X POST http://localhost:3005/api/user/register -H "Content-Type: application/json" -d '{"name":"Alex","email":"a@b.c","password":"pass","role":"user"}'`
- [ ] 5.2 Lancer le front (`cd front && npm run dev`), ouvrir `http://localhost:5173/users` → doit rediriger vers `/login` → se connecter → voir la liste → Logout → re-protection
- [ ] 5.3 Onglet réseau sur `GET /api/user` : confirmer qu'aucun champ `password`/hash n'apparaît dans la réponse

## 6. Docker — dev

- [x] 6.1 Service `front` (Vite, `Dockerfile.dev`) ajouté à `docker-compose.dev.yml` sur le réseau `dev`, port 5173, `VITE_API_PROXY_TARGET=http://api:3005`, volume + node_modules anonyme pour le hot reload

## 7. Docker — prod & Traefik

- [x] 7.1 `front/Dockerfile` multi-stage (`node` build → `nginx:alpine`) + `front/nginx.conf` avec fallback SPA `try_files ... /index.html`
- [x] 7.2 Service `front` ajouté à `docker-compose.yml` avec labels Traefik : router `front` = `Host(mondomaine.com)`
- [x] 7.3 Router Traefik de l'API passé en `Host(mondomaine.com) && PathPrefix(/api)` (sans stripprefix, l'API attend `/api` via le global prefix)
- [ ] 7.4 Déployer sur le VPS et valider login → liste → logout en HTTPS — **manuel** (remplacer `mondomaine.com` par le vrai domaine ; corriger d'abord les gaps env prod : `DB_USERNAME` et `JWT_SECRET` manquants dans le service `api`)

## 8. Documentation

- [x] 8.1 `api/CLAUDE.md` mis à jour (préfixe `/api`, topologie same-origin, logout, guard réactivé, exclusion password, expiration 1h)
- [x] 8.2 Dette `synchronize: true` en prod + gaps env prod (`DB_USERNAME`/`JWT_SECRET`) notés dans `CLAUDE.md`
