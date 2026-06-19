## ADDED Requirements

### Requirement: Users list requires authentication
`GET /api/user` SHALL be protected by `AuthGuard`, returning 401 when no valid `access_token` cookie is present. Role-based restriction (`RolesGuard`/ADMIN) is intentionally NOT enforced in this scope.

#### Scenario: Authenticated request
- **WHEN** a request to `GET /api/user` carries a valid `access_token` cookie
- **THEN** the API returns 200 with the list of users

#### Scenario: Unauthenticated request
- **WHEN** a request to `GET /api/user` has no valid cookie
- **THEN** the API returns 401

### Requirement: Password excluded from user responses
User responses from the API SHALL NOT include the `password` field (currently the full entity, including the bcrypt hash, is returned).

#### Scenario: List response shape
- **WHEN** `GET /api/user` returns users
- **THEN** each user object contains `id`, `name`, `email`, and `role`, and does NOT contain `password`

### Requirement: User routes under /api prefix
The user endpoints SHALL be reachable under the `/api` global prefix.

#### Scenario: List path
- **WHEN** an authenticated client requests `/api/user`
- **THEN** the API returns the users list
