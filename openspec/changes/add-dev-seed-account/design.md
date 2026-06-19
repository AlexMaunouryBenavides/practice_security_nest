## Context

The API is a NestJS app using TypeORM with `synchronize: true`, so the schema (including the `users` table) is created at API startup, not by MySQL. In Docker the MySQL volume starts empty, leaving no account to log in with. `GET /api/user` is protected by `AuthGuard` (JWT in an httpOnly cookie), so testing it from the front requires a real login.

Key existing pieces this design reuses:
- `UserService.createUser(dto)` — hashes the password with bcrypt and invalidates the `users` cache.
- `User` repository — for counting existing rows.
- `UserModule` already exports `UserService` (consumed by `AuthModule`).

## Goals / Non-Goals

**Goals:**
- A known account (`test@test.com` / `password`) exists automatically after a database reset, in dev/local only.
- Idempotent: safe to run on every startup; never duplicates or overwrites data.
- Never seeds in production.
- Reuse the existing creation path so hashing stays consistent — no parallel password logic.

**Non-Goals:**
- No multiple/admin/role seed accounts (single basic user only).
- No configurable credentials (hardcoded by decision).
- No seeding of any entity other than `users`.
- No new HTTP endpoint.

## Decisions

**Decision: Seed via a NestJS `OnApplicationBootstrap` lifecycle hook, not a MySQL init script.**
TypeORM creates the `users` table only when the API boots. A MySQL `docker-entrypoint-initdb.d` script runs before that table exists and would also require a hardcoded bcrypt hash. A bootstrap hook runs after `synchronize` has built the schema and can call `UserService` directly. Alternatives considered: SQL init script (rejected — ordering + hardcoded hash), manual `npm run seed` (rejected — user wants it automatic on every startup).

**Decision: Place the seed in a small `SeedService` registered in `UserModule`.**
`UserModule` already provides `UserService` and the `User` repository, so the seed has its dependencies locally with no new imports or circular-dependency risk. The service implements `OnApplicationBootstrap`.

**Decision: Empty-table check via `userRepository.count()`.**
If `count() === 0`, create the account; otherwise do nothing. Simple, idempotent, and cheap at startup.

**Decision: Gate on `process.env.NODE_ENV !== 'production'`.**
Matches the existing convention in the codebase (cookie `secure` flag, `synchronize` discussion). The hook returns early when in production.

## Risks / Trade-offs

- **Hardcoded weak credentials (`test@test.com` / `password`)** → Acceptable because the seed only runs outside production; the production gate prevents this account from ever existing on the VPS.
- **Bootstrap-time DB dependency** → The hook runs a query at startup; if MySQL is unreachable the app already fails to boot, so this adds no new failure mode. In dev compose, `depends_on: condition: service_healthy` already gates the API on MySQL readiness.
- **Race with `synchronize`** → `OnApplicationBootstrap` fires after modules are initialized (and after TypeORM has synchronized the schema), so the table is guaranteed to exist by then.
