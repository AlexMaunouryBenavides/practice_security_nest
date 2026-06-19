# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # watch mode (hot reload)
npm run build           # compile TypeScript to dist/

# Testing
npm run test            # unit tests (jest, rootDir: src, matches *.spec.ts)
npm run test:e2e        # e2e tests (config: test/jest-e2e.json)
npm run test:cov        # coverage report
npx jest src/user/user.service.spec.ts  # run a single test file

# Quality
npm run lint            # ESLint with auto-fix
npm run format          # Prettier
```

## Environment

Copy `.env.sample` to `.env` and fill in values before starting:

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=practice_auth_nest
PORT=3005
JWT_SECRET=your_secret_here
```

**Schema management is environment-split** (`src/config/database.config.ts`):
- **Dev** (`NODE_ENV !== 'production'`): `synchronize: true` applies entity changes automatically on startup — fast iteration.
- **Prod** (`NODE_ENV === 'production'`): `synchronize: false`, `migrationsRun: true` — the schema is owned by migrations in `src/migrations/` and applied automatically on boot (MySQL must be healthy first; the prod compose gates this via `depends_on`).

Migrations use a standalone CLI DataSource (`src/data-source.ts`, env-driven via dotenv):

```bash
# Generate a migration from entity changes (needs a reachable DB to diff against)
npm run migration:generate src/migrations/<Name>
npm run migration:run        # apply pending migrations
npm run migration:revert     # roll back the last one
```

`main.ts` defaults to port `3005` if `PORT` is unset.

## API routing & frontend

- **Global prefix:** `main.ts` calls `app.setGlobalPrefix('api')`, so every route lives under `/api` (`/api/auth/login`, `/api/user`, …). Update Postman collections accordingly.
- **Same-origin topology:** a Vite/React test front lives in `../front`. Dev: Vite proxies `/api` → `http://localhost:3005` (or `http://api:3005` in Docker via `VITE_API_PROXY_TARGET`). Prod: Traefik routes `Host(mondomaine.com)` → front and `Host(mondomaine.com) && PathPrefix(/api)` → api. Same origin ⇒ no CORS, the httpOnly cookie just works.
- ⚠️ **Prod env gaps** (`docker-compose.yml`, `api` service): env sets `DB_USER` but `database.config.ts` reads `DB_USERNAME`, and `JWT_SECRET` is not passed — both must be fixed before the API will run correctly in prod.

## Architecture

NestJS app with two feature modules:

- `AppModule` — root module, imports `ConfigModule` (global), `TypeOrmModule` (async via `src/config/database.config.ts`), `UserModule`, `AuthModule`.
- `UserModule` — standard CRUD resource: `UserController` → `UserService` → TypeORM `Repository<User>`. All methods are implemented (create hashes password with bcrypt, find/update/delete hit the DB directly).
- `AuthModule` — imports `UserModule`, registers `JwtModule` globally (reads `JWT_SECRET` from env, **1h** expiry). `AuthService.signIn` looks up user by email, verifies bcrypt hash, returns a signed JWT. `AuthController` sets it as an httpOnly cookie (`access_token`, `maxAge` 1h, `secure` only when `NODE_ENV=production`). `POST /api/auth/logout` clears the cookie (an httpOnly cookie can't be removed by client JS).
- `AuthGuard` (`src/auth/auth.guard.ts`) — `CanActivate` guard that reads the JWT from the `access_token` **cookie** and attaches the decoded payload to `request.user`. Also injects `UserService`.
- `RolesGuard` (`src/auth/guards/roles.guard.ts`) — `CanActivate` guard that uses `Reflector` to read the `@Roles(...)` metadata and checks `user.role` against required roles. Returns `true` (allow) when no roles are required.
- `@Roles` decorator (`src/auth/decorators/roles.decorator.ts`) — sets metadata under the `ROLES_KEY = 'role'` key; consumed by `RolesGuard`.

### Key types

- `UserRole` (`src/types/user-role.type.ts`) — enum with `USER` and `ADMIN` values; stored as a MySQL enum column on `User`.
- `JwtPayload` (`src/types/jwt-payload.type.ts`) — `{ sub: number, role: string }` — what `AuthGuard` attaches to `request.user`.

### Auth & roles flow notes

- Login sets the token as an httpOnly cookie (`access_token`); `AuthGuard` extracts it from `request.cookies`.
- `cookie-parser` middleware is registered in `main.ts`.
- `JwtModule` is global, so `JwtService` can be injected anywhere without re-importing `JwtModule`.
- `GET /user` is protected by `@UseGuards(AuthGuard)` (401 without a valid cookie). `RolesGuard`/`@Roles(ADMIN)` is intentionally **not** applied (kept minimal — no admin seed required). To enforce roles later, add `RolesGuard` to `@UseGuards(AuthGuard, RolesGuard)` and register it as a provider in `UserModule`.
- **Password is never returned:** `UserService.findAll`/`findOne` map rows through `toPublicUser()` (allowlist `id`/`name`/`email`/`role`), so the bcrypt hash never leaves the API — including via the cached `users` entry. `readOneByEmail` (auth only) still returns the full entity for bcrypt comparison. (Chosen over `@Exclude` + `ClassSerializerInterceptor` because `class-transformer` isn't installed and the interceptor wouldn't strip the cached plain objects.)
- `AuthGuard` injects `UserService`, which lives in `UserModule`. Since `AuthModule` imports `UserModule`, `AuthGuard` can be provided inside `AuthModule` and exported so `UserModule` can consume it without a circular dependency.

## Key patterns

- Feature modules register entities with `TypeOrmModule.forFeature([Entity])` and inject repositories via `@InjectRepository`.
- DTOs live in `src/<feature>/dto/`. Update DTOs use `PartialType` from `@nestjs/mapped-types`.
- Shared types (enums, interfaces) live in `src/types/`.
- Guards used with `@UseGuards(GuardClass)` must be registered in a module's `providers` array (or globally) to participate in NestJS DI — a class reference alone is not enough if the guard has injected dependencies.
