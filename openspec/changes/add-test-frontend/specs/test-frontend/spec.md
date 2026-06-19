## ADDED Requirements

### Requirement: Login screen
The front SHALL provide a `/login` route with an email/password form that authenticates against `POST /api/auth/login` using `credentials: 'include'` so the httpOnly cookie is set by the browser.

#### Scenario: Successful login
- **WHEN** a user submits valid credentials on `/login`
- **THEN** the request to `POST /api/auth/login` returns 200, the `access_token` cookie is set, and the user is redirected to `/users`

#### Scenario: Invalid credentials
- **WHEN** a user submits credentials that the API rejects (401)
- **THEN** an inline error message is shown on the login form and the user stays on `/login`

### Requirement: Protected users list
The front SHALL provide a `/users` route that fetches `GET /api/user` via React Query and renders the users in a table.

#### Scenario: Authenticated access
- **WHEN** an authenticated user navigates to `/users`
- **THEN** the list of users is fetched and displayed in a table

#### Scenario: Loading and error states
- **WHEN** the users query is loading or fails (non-401)
- **THEN** the UI shows a loading indicator while pending and an error message on failure

### Requirement: Password never displayed
The front SHALL NOT render any password field in the users table, regardless of what the API response contains.

#### Scenario: Table columns
- **WHEN** the users table is rendered
- **THEN** only `id`, `name`, `email`, and `role` columns are shown and no password value appears in the DOM

### Requirement: Session expiry handling
The front SHALL treat any `401` response from a protected request as "not authenticated" and redirect the user to `/login`.

#### Scenario: Unauthenticated visit to protected route
- **WHEN** an unauthenticated user (no valid cookie) requests `/users` and `GET /api/user` returns 401
- **THEN** the user is redirected to `/login`

#### Scenario: Cookie expires during session
- **WHEN** the cookie expires and a subsequent `GET /api/user` returns 401
- **THEN** the user is redirected to `/login`

### Requirement: Logout
The front SHALL provide a logout action that calls `POST /api/auth/logout` and, on success, clears React Query cache and redirects to `/login`.

#### Scenario: User logs out
- **WHEN** an authenticated user triggers logout
- **THEN** `POST /api/auth/logout` is called, the cookie is cleared server-side, and the user is redirected to `/login`

### Requirement: Same-origin API client
The front SHALL call the API through relative `/api/...` paths (never an absolute API host) so the same code works behind the Vite dev proxy and behind Traefik in production.

#### Scenario: API base path
- **WHEN** the front issues any API request
- **THEN** the request URL is relative and prefixed with `/api`
