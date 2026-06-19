## ADDED Requirements

### Requirement: Bootstrap test account seeding

The system SHALL seed a single known test account during application bootstrap, after the database schema has been created, so that a freshly reset database has an account available for login.

The seeded account SHALL use the fixed credentials `test@test.com` / `password`, and the password SHALL be hashed with bcrypt via the existing user-creation path (`UserService.createUser`), never stored in plaintext.

#### Scenario: Empty users table is seeded

- **WHEN** the API completes bootstrap in a non-production environment and the `users` table contains zero rows
- **THEN** the system creates a user with email `test@test.com` and a bcrypt-hashed `password`
- **AND** the account can immediately be used to log in via `POST /api/auth/login`

#### Scenario: Existing users are not modified

- **WHEN** the API completes bootstrap and the `users` table already contains at least one user
- **THEN** the system performs no insert and leaves existing data untouched (idempotent)

### Requirement: Production safety gate

The seeding behavior MUST be disabled when `NODE_ENV` is `production`, so that no default account is ever created on a production deployment.

#### Scenario: Production bootstrap skips seeding

- **WHEN** the API completes bootstrap with `NODE_ENV` set to `production`
- **THEN** the system performs no seeding regardless of whether the `users` table is empty
