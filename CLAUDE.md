# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Thông Thái Space** is a freelance project management SaaS with AI capabilities. It is a monorepo containing:
- `backend/` — NestJS REST + WebSocket API
- `frontend/` — Next.js 16 / React 19 web app

## Commands

All commands use **pnpm**. Run them from the respective `backend/` or `frontend/` directory.

### Backend (`cd backend`)
```bash
pnpm start:dev          # Dev server with hot-reload (port 4000)
pnpm build              # Compile TypeScript via nest build
pnpm start:prod         # Run compiled output: node dist/src/main.js
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier format
pnpm test               # Jest unit tests
pnpm test:watch         # Jest in watch mode
pnpm test:cov           # Jest with coverage
pnpm test:e2e           # E2E tests (jest --config ./test/jest-e2e.json)
```

Run a single test file:
```bash
pnpm test -- --testPathPattern=auth.service
```

### Frontend (`cd frontend`)
```bash
pnpm dev                # Dev server (port 3000)
pnpm build              # Next.js production build
pnpm lint               # ESLint
pnpm test               # Vitest run (single pass)
pnpm test:watch         # Vitest interactive watch
pnpm test:cov           # Vitest with coverage
```

### Database (Prisma — run from `backend/`)
```bash
npx prisma migrate dev --name <migration-name>   # Create and apply migration
npx prisma migrate deploy                        # Apply pending migrations (prod)
npx prisma studio                                # Visual DB browser
npx prisma generate                              # Regenerate Prisma client after schema change
```

### Infrastructure
```bash
docker compose up -d postgres redis              # Start only DB + cache
docker compose up -d                             # Start all services
docker compose --profile tools up -d             # Include pgAdmin (port 5050)
```

## Environment Setup

Copy `backend/.env.example` to `backend/.env`. Required variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing keys |
| `REDIS_URL` | Redis connection string |
| `ANTHROPIC_API_KEY` | Claude AI features |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth login |
| `R2_*` | Cloudflare R2 file storage |
| `RESEND_API_KEY` | Transactional email |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push notifications |

Frontend environment: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`) and `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:4000`).

## Architecture

### Backend (NestJS)

**API prefix:** all routes are under `/api`. Swagger UI at `/api/docs` (non-production only).

**Module layout** (`backend/src/modules/`):

| Module | Responsibility |
|---|---|
| `auth` | JWT + Google OAuth, access/refresh token rotation |
| `user` | User profile & management |
| `project` | Project CRUD, status lifecycle |
| `task` | Tasks, subtasks, milestones |
| `client` | Client-facing project views |
| `invoice` | Invoice generation, status tracking |
| `ai` | Anthropic Claude integration — chat, proposals, task breakdown, code review, estimates, reports |
| `notification` | In-app + Web Push notifications |
| `message` | Direct messaging between users |
| `file` | Cloudflare R2 file uploads |
| `portfolio` | Public showcase content |
| `contact` | Landing page contact requests |
| `content` | CMS for site sections |
| `export` | Document export (PDF, DOCX, XLSX) |
| `health` | Health check endpoint |

**Key infrastructure:**
- **Database:** PostgreSQL via Prisma ORM (`backend/prisma/schema.prisma`)
- **Cache + Rate limiting:** Redis (via `@keyv/redis` and `@nest-lab/throttler-storage-redis`)
- **Real-time:** Socket.IO with Redis adapter (`backend/src/common/redis-io.adapter.ts`)
- **Auth:** JWT access tokens (15 min) + refresh tokens (7 days) stored as hashed cookies; Google OAuth via `passport-google-oauth20`

**Roles:** `OWNER > ADMIN > MEMBER > CLIENT`. The `isOwnerOrAdmin` and `isTeamMember` helpers are defined in the auth context.

### Frontend (Next.js)

**Route groups:**

| Route group | Access |
|---|---|
| `(auth)/` | Login, register, Google OAuth callback |
| `(landing)/` | Public marketing pages (portfolio, contact, terms, privacy) |
| `dashboard/` | OWNER / ADMIN workspace |
| `member/` | MEMBER workspace |
| `portal/` | CLIENT self-service portal |

**Key shared libraries (`frontend/src/lib/`):**

- `api.ts` — Axios instance with automatic JWT refresh on 401; redirects to `/login` from protected routes on refresh failure
- `auth.tsx` — `AuthProvider` / `useAuth` hook; exposes `user`, `login`, `loginWithGoogle`, `register`, `logout`, `isOwnerOrAdmin`, `isTeamMember`, `isClient`
- `socket.tsx` — `SocketProvider` / `useSocket` hook; singleton Socket.IO connection with reconnection logic
- `query-provider.tsx` — TanStack React Query provider

**Data fetching:** TanStack React Query hooks live in `frontend/src/hooks/` (e.g., `use-projects.ts`, `use-tasks.ts`). Global client-side state (e.g., AI chat) uses Zustand stores in `frontend/src/stores/`.

**UI:** Tailwind CSS v4, Radix UI primitives, Framer Motion, Lucide icons.

### Data Model Highlights

- `User` roles: `OWNER`, `ADMIN`, `MEMBER`, `CLIENT`
- `Project` supports dual-currency (`VND`/`USD`), tech stack metadata, and portfolio showcase flags
- `Task` supports subtasks (self-referential), milestones, time entries, and labels
- `AiConversation` / `AiMessage` persist AI chat history; `AiUsageAudit` tracks token usage and cost per `AiFeature` enum value
- `AiApplyRequest` is a review workflow for AI-generated strategic plans before applying them to a project
