## Why

After moving MySQL into Docker, the database starts from an empty volume. The schema is created automatically (`synchronize: true`), but there are no users — so there is no way to log in and exercise the auth-protected `GET /api/user` route from the front. Every time the volume is reset, manual account recreation is required just to test.

## What Changes

- Add a dev-only seed that runs on API bootstrap and creates a single basic test account (`test@test.com` / `password`) when the `users` table is empty.
- The seed runs **after** TypeORM has created the schema (application bootstrap lifecycle), reuses `UserService.createUser` so the password is bcrypt-hashed exactly like a normal registration, and is idempotent (skips if any user already exists).
- The seed is gated on `NODE_ENV !== 'production'` so it never creates a default account on the production VPS.

## Capabilities

### New Capabilities
- `dev-seed`: Automatic creation of a known test account on startup in non-production environments, enabling login and testing of protected routes against a freshly reset database.

### Modified Capabilities
<!-- None: no existing spec-level behavior changes. UserService.createUser is reused as-is. -->

## Impact

- **New code**: a seed service in the `api` (NestJS), wired into a module so its `OnApplicationBootstrap` hook runs at startup.
- **Reuses**: `UserService.createUser` (bcrypt hashing + cache invalidation already handled), `User` repository for the empty-table check.
- **Runtime**: only affects non-production environments (dev Docker / local). No production behavior change.
- **No API contract change**: no new HTTP routes; `register`, `login`, and `GET /api/user` are unchanged.
