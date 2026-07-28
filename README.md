# GitHub Repository Intelligence and Developer Activity Dashboard

Production-minded technical assessment project for searching GitHub repositories and developers, normalizing public GitHub API data, caching expensive calls, storing search history, and presenting the results in a simple dashboard.

## High-Level Architecture

The system is a modular monolith with a NestJS API, PostgreSQL persistence for application-owned search history, Redis for GitHub response caching, and a lightweight Next.js frontend.

```mermaid
flowchart LR
  Web["Next.js Dashboard"] --> Api["NestJS API"]
  Api --> RepoModule["Repositories Module"]
  Api --> DevModule["Developers Module"]
  RepoModule --> Cache["Redis Cache"]
  DevModule --> Cache
  RepoModule --> Github["GitHub REST API"]
  DevModule --> Github
  RepoModule --> History["Search History Service"]
  DevModule --> History
  History --> Postgres["PostgreSQL via Prisma"]
```

The backend owns external API integration, caching, validation, normalization, rate-limit translation, retry behavior, Swagger docs, logging, and durable search history. The frontend intentionally stays thin.

## Project Structure

```text
apps/
  api/
    prisma/schema.prisma
    src/
      common/              # filters, interceptors, shared exceptions
      config/              # env config and validation
      database/            # Prisma service
      modules/
        cache/             # deterministic Redis cache service
        github/            # GitHub API client and normalizers
        repositories/      # repository search/details/activity API
        developers/        # developer search/profile API
        search-history/    # persisted searches
        health/            # health endpoint
  web/
    src/app/               # Next.js pages
    src/components/        # reusable UI pieces
    src/lib/api.ts         # API client helpers
```

## Database Schema

```prisma
model SearchHistory {
  id          String   @id @default(cuid())
  searchType  String
  query       String
  filters     Json
  resultCount Int
  createdAt   DateTime @default(now())

  @@index([searchType, createdAt])
  @@index([createdAt])
}
```

GitHub repository and developer data are not persisted because GitHub remains the source of truth and the assessment value is external API integration plus cache behavior. Persisting public GitHub entities would add sync/staleness complexity without improving the core user workflow.

## API Endpoints

- `GET /api/v1/repositories/search`
- `GET /api/v1/repositories/:owner/:repo`
- `GET /api/v1/repositories/:owner/:repo/commits`
- `GET /api/v1/repositories/:owner/:repo/contributors`
- `GET /api/v1/repositories/:owner/:repo/issues`
- `GET /api/v1/repositories/:owner/:repo/pull-requests`
- `GET /api/v1/developers/search`
- `GET /api/v1/developers/:username`
- `GET /api/v1/developers/:username/repositories`
- `GET /api/v1/search-history`
- `GET /api/v1/health`

Swagger is available at `/docs` when the API is running.

## Repository Search Flow

1. The controller validates query DTOs with class-validator.
2. `RepositoriesService` converts filters into GitHub search qualifiers such as `language:TypeScript`, `stars:>=1000`, and `pushed:>=2024-01-01`.
3. The service builds a deterministic Redis key from the normalized request.
4. On cache hit, the cached normalized response is returned and GitHub is not called.
5. On cache miss, `GithubApiClient` calls GitHub with timeout, retries transient failures, and translates rate-limit errors.
6. GitHub data is normalized before being returned.
7. Search metadata is stored in PostgreSQL through Prisma.

## Caching Strategy

Redis caches the expensive, repeatable GitHub reads:

- Repository searches: `CACHE_TTL_REPOSITORY_SEARCH_SECONDS`
- Repository details: `CACHE_TTL_REPOSITORY_DETAILS_SECONDS`
- Repository activity: `CACHE_TTL_REPOSITORY_ACTIVITY_SECONDS`
- Developer profiles/searches: `CACHE_TTL_DEVELOPER_PROFILE_SECONDS`

Cache keys are deterministic SHA-256 hashes of sorted request payloads. This avoids duplicate keys caused by parameter ordering. Cache failures are logged and treated as degraded mode so the API can still serve uncached responses.

`CacheService.invalidateByPrefix` is included for operational invalidation. In a larger production system, this could be exposed behind an admin-only endpoint or used by background refresh jobs.

## Error, Retry, and Rate-Limit Strategy

The GitHub client applies request timeouts and retries only transient failures: network/timeout errors, `408`, `429`, and `5xx`. It uses exponential backoff and does not retry invalid requests or `404`s.

GitHub rate-limit responses are detected from `x-ratelimit-*` headers. When remaining requests reach zero, the API returns a consistent `429` response with rate-limit metadata. Other GitHub failures are translated into stable consumer-facing errors without exposing stack traces.

## Security and Observability

- Environment variables are validated on boot.
- Secrets are excluded from source control and documented in `.env.example`.
- Helmet and CORS are configured.
- Nest throttling provides basic API rate limiting.
- Global validation strips unknown input fields.
- A request interceptor logs method, path, status, and duration.
- GitHub failures, retry attempts, cache hits/misses, and cache degradation are logged.

## Testing Strategy

The automated tests mock GitHub and Redis. They cover:

- Deterministic cache key generation.
- Repository search query construction and search-history writes.
- GitHub retry behavior for transient failures.
- GitHub rate-limit error translation.

Integration tests can be extended with a mocked GitHub provider and a test database. The current suite avoids live GitHub calls by design.

## Local Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run dev:api
npm run dev:web
```

Open:

- API: `http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/docs`
- Web: `http://localhost:3001`

## Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

Docker Compose starts PostgreSQL, Redis, and the API. Run Prisma migrations against the compose database before first use:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/github_intelligence?schema=public npm run prisma:migrate -w apps/api
```

## Environment Variables

See `.env.example` for all supported variables. `GITHUB_TOKEN` is optional for public API access but strongly recommended because unauthenticated GitHub rate limits are low.

## Running Tests

```bash
npm test
```

## Deployment Architecture

Render or Railway can run the API as a Node service, PostgreSQL as a managed database, and Redis as a managed cache. The Next.js app can deploy as a separate web service or static/server-rendered service pointing `NEXT_PUBLIC_API_BASE_URL` at the deployed API.

The NestJS API is stateless, so multiple instances can run horizontally behind a load balancer. PostgreSQL stores durable application data, while Redis is shared across API instances to reduce GitHub calls and smooth rate-limit pressure.

## Scalability Considerations

- Redis reduces external API dependency and improves latency for repeated searches/details.
- Stateless API instances can scale horizontally without sticky sessions.
- PostgreSQL is used only for application-owned state.
- If GitHub is unavailable, cached responses continue to serve where available; uncached calls fail with consistent errors.
- Rate-limit metadata is exposed so clients can back off intelligently.
- A queue could be introduced later for scheduled repository refreshes, trend snapshots, or heavy activity aggregation.
- Metrics could be added through OpenTelemetry/Prometheus for cache hit rate, GitHub latency, retry counts, and endpoint latency.

## Architectural Trade-Offs

- This is a modular monolith rather than microservices to keep the assessment scoped and maintainable.
- GitHub data is cached, not persisted, to avoid stale secondary storage.
- Developer search enriches users with profile calls, which produces better UI data but can consume more rate-limit budget; Redis cache mitigates repeated lookups.
- The frontend is simple and functional so the backend architecture remains the focus.

## Known Limitations

- No authentication or admin interface.
- Cache invalidation is implemented as a service method, not exposed as a secured admin endpoint.
- Integration tests are intentionally minimal and should be expanded before production launch.
- Docker Compose runs the API but not the frontend.

## Future Improvements

- Add OpenTelemetry tracing and Prometheus metrics.
- Add background refresh jobs for popular repositories.
- Add saved/favorite repositories per authenticated user.
- Add trend snapshots using scheduled GitHub queries.
- Add a secured admin endpoint for cache invalidation.
