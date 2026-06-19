## ADDED Requirements

### Requirement: Logout endpoint
The API SHALL expose `POST /api/auth/logout` that clears the `access_token` cookie, since an httpOnly cookie cannot be removed by client-side JavaScript.

#### Scenario: Logout clears cookie
- **WHEN** a client calls `POST /api/auth/logout`
- **THEN** the response clears the `access_token` cookie (`clearCookie`) and returns a success message

### Requirement: Extended session lifetime
The API SHALL issue JWTs with a `1h` expiry and set the `access_token` cookie `maxAge` to match (3600000 ms), to make manual testing practical.

#### Scenario: Token and cookie lifetime
- **WHEN** a user logs in via `POST /api/auth/login`
- **THEN** the signed JWT expires in 1 hour and the cookie `maxAge` is set to 1 hour

### Requirement: Auth routes under /api prefix
The auth endpoints SHALL be reachable under the `/api` global prefix.

#### Scenario: Login path
- **WHEN** a client posts credentials to `/api/auth/login`
- **THEN** the API authenticates and sets the cookie as specified
