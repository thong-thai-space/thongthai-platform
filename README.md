# Thông Thái Space

A Vietnamese SaaS for tech freelancers: project, task, client and invoice management with an AI assistant, real-time collaboration and a public portfolio.

## Stack

| Layer | Tech |
|---|---|
| Backend | NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, Socket.IO 4 |
| Frontend | Next.js 16, React 19, TailwindCSS 4, TanStack Query 5, Zustand |
| Auth | JWT (access 15m / refresh 7d, HttpOnly cookies), Google OAuth |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Storage | Local filesystem or Cloudflare R2 (S3-compatible) |
| Email | Resend |
| Infra | Docker Compose, Nginx, Railway-ready |

## Features

- Project / task / client / invoice management (multi-currency, VND & USD)
- AI assistant: chat, proposal drafting, estimation, code review, strategic plans
- Real-time notifications via Socket.IO + optional Web Push (VAPID)
- Email & password auth with verification, Google OAuth, optional Cloudflare Turnstile
- File uploads to local disk or Cloudflare R2
- Client portal and public portfolio pages
- Document export: PDF, DOCX, XLSX

## Repository Layout

```
backend/             NestJS API (Clean Architecture per module)
frontend/            Next.js App Router
deploy/
  nginx/             Reverse proxy configs
  monitoring/        Prometheus / Grafana stack
  backup/            Backup scripts
docker-compose.yml         Local dev (Postgres + Redis)
docker-compose.prod.yml    Production stack
CLAUDE.md            Engineering standards & AI agent guidance
```

## Requirements

- Node.js ≥ 20.18
- pnpm 10
- Docker & Docker Compose (for Postgres + Redis)

## Quick Start

```bash
# 1. Infrastructure (Postgres + Redis)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env            # fill in secrets (see below)
pnpm install
npx prisma migrate dev
pnpm start:dev                  # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
pnpm install
pnpm dev                        # http://localhost:3000
```

| Endpoint | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API (versioned) | http://localhost:4000/api/v1 |
| Swagger (non-prod) | http://localhost:4000/api/v1/docs |
| Health probe | http://localhost:4000/api/healthz |

## Environment

Backend variables are documented in [backend/.env.example](backend/.env.example). Required for boot:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Cache, rate-limit store, Socket.IO adapter |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | 32+ char signing keys |
| `ANTHROPIC_API_KEY` | Claude AI features |
| `FRONTEND_URL` | CORS origin |
| `PORT` | API port (default `4000`) |

Feature-gated: `STORAGE_PROVIDER=r2` (+ R2 keys), `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `VAPID_*`, `TURNSTILE_SECRET`.

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Scripts

### Backend (`cd backend`)

| Command | Description |
|---|---|
| `pnpm start:dev` | Dev server with hot reload |
| `pnpm build` | Compile to `dist/` |
| `pnpm start:prod` | Run compiled build |
| `pnpm lint` | ESLint (auto-fix) |
| `pnpm test` / `test:cov` / `test:e2e` | Jest unit / coverage / E2E |
| `pnpm db:migrate:dev` | Create & apply Prisma migration |
| `pnpm db:migrate:deploy` | Apply migrations (production) |
| `pnpm db:studio` | Prisma Studio on :5555 |

### Frontend (`cd frontend`)

| Command | Description |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm test` / `test:watch` / `test:cov` | Vitest |

## Architecture

The backend follows Clean Architecture per module:

```
modules/<name>/
  domain/         ports & types          (no dependencies)
  policies/      business rules
  use-cases/     application logic
  adapters/      port implementations
  repositories/  Prisma-backed data access
  dto/           class-validator inputs
  <name>.module.ts       composition root
  <name>.service.ts      thin facade
  <name>.controller.ts   HTTP layer
```

Call flow: `Controller → Service (Facade) → UseCase → Port → Repository → Prisma`.

See [CLAUDE.md](CLAUDE.md) for full engineering standards (SOLID, DI, error handling, testing, security).

## Deployment

- `docker-compose.prod.yml` — full production stack (API, web, Postgres, Redis, Nginx)
- `deploy/nginx/` — reverse-proxy templates
- `deploy/monitoring/` — Prometheus + Grafana
- `deploy/backup/` — database backup scripts
- `backend/railway.toml`, `frontend/railway.toml` — Railway deployment configs

## License

UNLICENSED — proprietary.
