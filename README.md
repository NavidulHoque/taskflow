# TaskFlow

A lightweight project and task management backend — built as a **Bun + Turborepo monorepo** with NestJS, Supabase, Drizzle ORM, and oRPC.

## Tech Stack

| Concern | Technology |
|---|---|
| Runtime | Bun |
| Framework | NestJS v11 + Fastify |
| Monorepo | Turborepo |
| Auth | Supabase Auth (JWT / Bearer tokens + OAuth) |
| Database | PostgreSQL + Drizzle ORM |
| File Storage | Supabase Storage (signed URLs) |
| API Layer | oRPC (type-safe procedures with OpenAPI generation) |
| Validation | Zod v4 |
| API Docs | oRPC Reference UI (`/api/docs`) |
| Rate Limiting | `@fastify/rate-limit` |
| Security | `@fastify/helmet` (CSP headers) |

## Monorepo Structure

```
.
├── apps/
│   └── backend/              # NestJS + Fastify application
│       └── src/
│           ├── modules/      # auth, users, projects, tasks, storage, supabase, health
│           └── orpc/         # OrpcService — context builder + route handler wiring
├── packages/
│   ├── shared/               # Shared enums and error codes
│   ├── supabase/             # Admin + anon Supabase client factories
│   ├── database/             # Drizzle schema, migrations, and db client
│   ├── validation/           # Zod input schemas and typed output schemas
│   └── orpc/                 # oRPC routers, procedures, service interfaces, and Context type
├── turbo.json
├── bunfig.toml
└── package.json
```

## Features

- **Auth** — Supabase-managed email/password registration and login, OAuth (Google), OTP-based password reset, token refresh, and session logout
- **Users** — Profile read/update, password change, account deletion
- **Projects** — Full CRUD with archive/unarchive, per-project task stats grouped by status and priority
- **Tasks** — Create, list (with search, filter by status/priority, sort, pagination), update, delete; bulk status update, bulk priority update, bulk delete
- **File uploads** — Signed URL flow via Supabase Storage
- **API docs** — Auto-generated OpenAPI spec and interactive Reference UI at `/api/docs` via oRPC
- **Rate limiting** — 100 requests per minute per IP via `@fastify/rate-limit`
- **Type safety** — End-to-end types from Zod schemas through oRPC procedures to the client-facing `AppRouterClient` export

## Database Schema

| Table | Purpose |
|---|---|
| `users` | User profiles synced from Supabase Auth |
| `projects` | Projects owned by a user, with optional archive timestamp |
| `tasks` | Tasks belonging to a project; status and priority enums |
| `uploads` | Metadata for files stored in Supabase Storage |

Migrations are managed with Drizzle Kit and live in `packages/database/drizzle/`.

## API Overview

All routes are served under the `/api` prefix and documented at `/api/docs`. Authentication uses Bearer tokens issued by Supabase.

| Tag | Key Endpoints |
|---|---|
| `auth` | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh-token`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/oauth/url`, `POST /auth/oauth/exchange` |
| `users` | `GET /users/me`, `PATCH /users/me`, `DELETE /users/me`, `POST /users/me/change-password` |
| `projects` | `POST /projects`, `GET /projects`, `GET /projects/{id}`, `PATCH /projects/{id}`, `DELETE /projects/{id}`, `PATCH /projects/{id}/archive`, `PATCH /projects/{id}/unarchive`, `GET /projects/{id}/stats` |
| `tasks` | `POST /projects/{projectId}/tasks`, `GET /projects/{projectId}/tasks`, `PATCH /tasks/{id}`, `PATCH /tasks/{id}/status`, `DELETE /tasks/{id}`, `PATCH /projects/{projectId}/tasks/bulk-status`, `PATCH /projects/{projectId}/tasks/bulk-priority`, `DELETE /projects/{projectId}/tasks/bulk` |
| `uploads` | `POST /uploads/signed-url` |

## Environment Variables

Create a `.env` file in the root (see `.env.example` for all keys):

```env
# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=

# Supabase
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Database
DATABASE_URL=
```

## Running Locally

```bash
git clone <repo-url>
cd taskflow

bun install

# Run database migrations
bun run db:migrate

# Start the backend in watch mode
bun run dev:backend
```

No Docker required — Supabase provides Auth, Storage, and the managed Postgres database.

API docs are available at `http://localhost:3000/api/docs` once the server is running.

## Database Commands

```bash
bun run db:migrate   # Apply pending migrations
bun run db:status    # Show migration status
bun run db:reset     # Reset the database (destructive)
```

## Running Tests

```bash
bun run test           # Run all unit tests
bun run test:watch     # Watch mode
```
