## ADDED Requirements

### Requirement: Same-origin in development via Vite proxy
The dev setup SHALL serve the front and proxy `/api` requests to the API so the browser sees a single origin and no CORS is required.

#### Scenario: Dev API call
- **WHEN** the front (Vite dev server) requests `/api/...`
- **THEN** Vite proxies the request to `http://localhost:3005` and the cookie is sent/received without CORS configuration

### Requirement: Same-origin in production via Traefik path routing
The production deployment SHALL route a single host so that `/` serves the front (static files via nginx) and `/api` routes to the API container.

#### Scenario: Production routing
- **WHEN** a browser requests `https://<host>/` it is served the front, and `https://<host>/api/...` is routed to the API
- **THEN** front and API share one origin, so the httpOnly cookie works without CORS

### Requirement: API mounted under /api prefix
The API SHALL expose all routes under the `/api` global prefix so path-based same-origin routing resolves correctly.

#### Scenario: Global prefix applied
- **WHEN** the API starts with `setGlobalPrefix('api')`
- **THEN** endpoints respond at `/api/auth/login`, `/api/user`, etc.

### Requirement: Secure cookie in production
The auth cookie SHALL set `secure: true` when `NODE_ENV=production` and `secure: false` otherwise, so it is transmitted over HTTPS in prod without breaking local HTTP testing.

#### Scenario: Production cookie
- **WHEN** the API runs with `NODE_ENV=production`
- **THEN** the `access_token` cookie is set with `secure: true`

#### Scenario: Local cookie
- **WHEN** the API runs locally without `NODE_ENV=production`
- **THEN** the `access_token` cookie is set with `secure: false` so it works over HTTP
