## 1. Seed service

- [x] 1.1 Create `api/src/user/seed.service.ts` with a `SeedService` implementing `OnApplicationBootstrap`, injecting `UserService` and the `User` repository
- [x] 1.2 In `onApplicationBootstrap`, return early when `process.env.NODE_ENV === 'production'`
- [x] 1.3 Use `userRepository.count()`; when it is `0`, call `userService.createUser({ name: 'test', email: 'test@test.com', password: 'password' })`
- [x] 1.4 Log a short message when the test account is seeded (and skip silently otherwise)

## 2. Wiring

- [x] 2.1 Register `SeedService` in `UserModule` providers
- [x] 2.2 Confirm `UserModule` already provides `UserService` and `TypeOrmModule.forFeature([User])` so no new imports are needed

## 3. Verify

- [x] 3.1 `cd api && npm run build` compiles with no errors
- [x] 3.2 Reset the dev DB volume and start the stack (`docker compose -f docker-compose.dev.yml down -v` then `up`); confirm the seed log appears once
- [x] 3.3 From the front (`localhost:5173`) log in with `test@test.com` / `password` and confirm `GET /api/user` returns 200 with the user list
- [x] 3.4 Restart the API without resetting the volume and confirm no duplicate account is created (idempotent)
