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

Copy `.env.sample` to `.env` and fill in MySQL credentials before starting:

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=practice_auth_nest
PORT=3000
```

TypeORM runs with `synchronize: true` — schema changes are applied automatically on startup (dev only).

## Architecture

NestJS app wired as follows:

- `AppModule` — root module, imports `ConfigModule` (global), `TypeOrmModule` (async, reads DB env vars via `ConfigService`), and feature modules.
- `src/config/database.config.ts` — TypeORM async factory; centralises all DB config in one place.
- `src/user/` — the only feature module so far. Standard NestJS resource layout: `UserModule` → `UserController` → `UserService` → TypeORM `Repository<User>`.
- `User` entity (`src/user/entities/user.entity.ts`) — has `id`, `name`, `email`, `password` columns. Password is stored in plain text at this stage; the project is a security practice exercise focused on adding auth/hashing.

The project name (`practice_auth_nest`) indicates the goal is to implement authentication and security features (JWT, bcrypt password hashing, guards, etc.) on top of this scaffold.

## Key patterns

- Feature modules register their entities with `TypeOrmModule.forFeature([Entity])` and inject repositories via `@InjectRepository`.
- DTOs live in `src/<feature>/dto/` and use `@nestjs/mapped-types` (`PartialType`) for update DTOs.
- `UserService` methods are currently stubs — they return placeholder strings and need real implementations.
- `userRepository` is imported from `typeorm/browser/…` (line 6 of `user.service.ts`) — this should be `typeorm` (the Node.js build), not the browser sub-path.
