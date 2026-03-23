# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Thông Thái Space** — Vietnamese tech freelance project management SaaS with AI capabilities.

**Status**: In active development (v0.0.1 / v0.1.0) — Core auth, projects, tasks, invoicing, AI assistant features complete. Deployment-ready with security hardening.

**Repository Structure**: Monorepo with:
- `backend/` — NestJS 11 + Prisma 7 + PostgreSQL + Redis
- `frontend/` — Next.js 15 + React 19 + TailwindCSS v4
- `docs/`, `deploy/`, `nginx/` — Infrastructure & deployment configs

## Commands

All commands use **pnpm** (workspace configured with pnpm-workspace.yaml). Run from respective `backend/` or `frontend/` directory.

### Backend (`cd backend`)
```bash
pnpm start:dev          # Dev server with hot-reload & watch (port 4000)
pnpm build              # Compile TypeScript (nest build)
pnpm start:prod         # Production: node dist/src/main.js
pnpm lint               # ESLint auto-fix
pnpm format             # Prettier format

pnpm test               # Jest unit tests
pnpm test:watch        # Jest in watch mode
pnpm test:cov          # Jest with coverage report
pnpm test:e2e          # E2E tests (jest --config ./test/jest-e2e.json)
```

Run a single test:
```bash
pnpm test -- --testPathPattern=auth.service
```

### Frontend (`cd frontend`)
```bash
pnpm dev                # Dev server (port 3000, with hot-reload)
pnpm build              # Next.js production build (optimized)
pnpm start              # Run production build via next start
pnpm lint               # ESLint
pnpm format             # Prettier format

pnpm test               # Vitest run (single pass)
pnpm test:watch        # Vitest interactive watch
pnpm test:cov          # Vitest with coverage report
```

### Database & Prisma (run from `backend/`)
```bash
# Migrations
npx prisma migrate dev --name <description>    # Create + apply migration
npx prisma migrate deploy                      # Apply pending (production)
npx prisma migrate reset --force               # Reset Dev DB (DANGER: deletes all data)
npx prisma migrate status                      # Check migration status

# Tools
npx prisma studio                              # Visual DB browser (http://localhost:5555)
npx prisma generate                            # Regenerate Prisma client after schema change
npx prisma seed                                # Run seed script (if defined)
```

### Infrastructure
```bash
# Start services with Docker Compose
docker compose up -d postgres redis           # DB + Cache only
docker compose up -d                          # All services (optional: mobile-stub, etc.)
docker compose --profile tools up -d          # Include pgAdmin (http://localhost:5050)
docker compose down                           # Stop all services
docker compose down -v                        # Stop and remove volumes (DATA LOSS)
```

### Full Local Workflow
```bash
# 1. Start infrastructure
docker compose up -d

# 2. Setup backend
cd backend
cp .env.example .env                          # Create .env (adjust env vars)
pnpm install                                  # Install deps (first time)
npx prisma migrate dev                        # Setup DB schema
pnpm start:dev                                # Dev server

# 3. Setup frontend (from new terminal)
cd frontend
pnpm install                                  # Install deps (first time)
pnpm dev                                      # Dev server
```

Then:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Swagger Docs: http://localhost:4000/api/docs
- PgAdmin: http://localhost:5050 (if started with --profile tools)
- Prisma Studio: http://localhost:5555 (when `pnpm prisma studio` runs)

## Environment Setup

### Backend (.env)

Copy `backend/.env.example` to `backend/.env`. Environment validation runs at startup (`backend/src/config/env.validation.ts`).

**Required Variables:**

| Variable | Type | Purpose | Example |
|---|---|---|---|
| `NODE_ENV` | `development|test|production` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL Connection String | Primary data store (Prisma 7 + adapter-pg) | `postgresql://thongthai:pass@localhost:5432/thongthai_space?schema=public` |
| `JWT_SECRET` | String (32+ chars) | Signing key for access tokens (15m expiry) | `your-secure-random-string-here` |
| `JWT_REFRESH_SECRET` | String (32+ chars) | Signing key for refresh tokens (7d expiry) | `your-refresh-token-secret` |
| `REDIS_URL` | Redis Connection String | Cache, rate limiting, Socket.IO adapter | `redis://localhost:6379` |
| `ANTHROPIC_API_KEY` | String | Claude AI integration (chat, proposals, estimates) | `sk-ant-...` |
| `PORT` | Number | Server port | `4000` |

**Optional (Feature-Gated) Variables:**

| Variable | Type | Purpose | When Required |
|---|---|---|---|
| `FRONTEND_URL` | URL | CORS origin (default: http://localhost:3000) | Always for security |
| `STORAGE_PROVIDER` | `local|r2` | File upload destination (default: `local`) | Set to `r2` for production |
| `R2_ACCOUNT_ID` | String | Cloudflare R2 account ID | Required if `STORAGE_PROVIDER=r2` |
| `R2_ACCESS_KEY_ID` | String | R2 API token ID | Required if `STORAGE_PROVIDER=r2` |
| `R2_SECRET_ACCESS_KEY` | String | R2 API token secret | Required if `STORAGE_PROVIDER=r2` |
| `R2_BUCKET_NAME` | String | R2 bucket name | Required if `STORAGE_PROVIDER=r2` |
| `R2_PUBLIC_URL` | URL | CDN URL for R2 (e.g., https://cdn.example.com) | Optional, used for public file URLs |
| `GOOGLE_CLIENT_ID` | String | Google OAuth client ID | Required to enable Google login |
| `GOOGLE_CLIENT_SECRET` | String | Google OAuth secret | Required to enable Google login |
| `GOOGLE_CALLBACK_URL` | URL | OAuth callback URL | `http://localhost:4000/api/auth/google/callback` |
| `RESEND_API_KEY` | String | Transactional email provider API key | Required for email verification, password reset |
| `VAPID_PUBLIC_KEY` | String | Web Push public key | Required for push notifications |
| `VAPID_PRIVATE_KEY` | String | Web Push private key | Required for push notifications |
| `VAPID_SUBJECT` | Email | Mailto subject for push (required by spec) | `mailto:your-admin-email@example.com` |

**Generate VAPID Keys for Push Notifications:**
```bash
npx web-push generate-vapid-keys
```

### Frontend (.env.local)

Create `frontend/.env.local` (Next.js convention):

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend API base URL (sent to client) |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Socket.IO server URL (real-time updates) |

**Note:** Prefixed with `NEXT_PUBLIC_` only if needed in browser. Backend URL is not necessarily public.

## Architecture

### Backend (NestJS 11)

**API Configuration:**
- **Prefix:** `/api` (global prefix in main.ts)
- **Swagger Docs:** `/api/docs` (non-production only)
- **Validation:** Global `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true`
- **Security:** Helmet, CORS, cookie-parser for HttpOnly cookies
- **File Serving:** `/uploads` static route for user-generated files
- **Rate Limiting:** Throttler (100 req/60s) backed by Redis

**Module Architecture** (`backend/src/modules/` — 16 modules):

| Module | Status | Responsibility | Key Features |
|---|---|---|---|
| **auth** | ✅ Complete | JWT + Google OAuth, token rotation | Access token (15m) + Refresh token (7d), email verification, password hashing (bcryptjs), strategies: JWT, JWT-Refresh, Google |
| **user** | ✅ Complete | User profile & team management | Create/update members, change-password, role-based access, profile avatar |
| **project** | ✅ Complete | Project CRUD, status lifecycle | Dual-currency (VND/USD), tech stack tagging, portfolio showcase flag, client relationship |
| **task** | ✅ Complete | Tasks, subtasks, milestones | Hierarchical tasks, due dates, priority, status tracking, milestone linking, comment threads |
| **client** | ✅ Complete | Client-facing portal views | Client authentication, project access scoping, invoice viewing, task participation |
| **invoice** | ✅ Complete | Invoice generation & tracking | Line items, dual-currency, payment status, PDF export, billing history |
| **ai** | ✅ Complete | Anthropic Claude integration | Chat (conversation history), proposals, task breakdown, code review, estimates, strategy reports; audit logging; cost tracking |
| **notification** | ✅ Complete | In-app + Web Push notifications | Gateway (Socket.IO), in-app message queue, push subscriptions, notification history |
| **message** | ✅ Complete | Direct messaging | User-to-user messaging, real-time via WebSocket, message history |
| **file** | ✅ Complete | File upload (local or R2) | Avatar uploads, project documents; supports local `/uploads` or Cloudflare R2 storage |
| **portfolio** | ✅ Complete | Public showcase content | User/company portfolio, featured projects, testimonials, case studies |
| **contact** | ✅ Complete | Landing page contact requests | Contact form submission, email notification to admins |
| **content** | ⚠️ In Progress | CMS for site sections | Hero, services, pricing, FAQs, testimonials (upsert-based, seed data included) |
| **export** | ✅ Complete | Document export | PDF (pdfkit), XLSX (exceljs), DOCX (docx) export for invoices/reports |
| **health** | ✅ Complete | Health check endpoint | Liveness probe for load balancers/Kubernetes |
| **email** | ✅ Complete | Transactional email (utility) | Resend integration, verification emails, password reset, notifications |

**Key Infrastructure:**
- **Database:** PostgreSQL 16 via Prisma 7 ORM with `@prisma/adapter-pg` (driver adapter pattern — no `url` in datasource)
- **Cache + Rate Limiting:** Redis 7 (`@keyv/redis` + `@nest-lab/throttler-storage-redis`)
- **Real-time Communication:** Socket.IO v4 with Redis adapter for horizontal scaling
- **Auth:** JWT (HS256), HttpOnly cookies, refresh token hashing (bcryptjs), Google OAuth 2.0
- **Logging:** NestJS built-in Logger (audit logs for AI feature usage)
- **Scheduling:** `@nestjs/schedule` for background tasks

**Roles & Authorization:**
- Hierarchy: `OWNER > ADMIN > MEMBER > CLIENT`
- Role-based Route Guards: `RolesGuard` + `@Roles()` decorator
- Per-resource Authorization: Service-level checks in task, project, client modules

**Data Validation:**
- DTOs with `class-validator` decorators (email, string, number, enum, custom validators)
- Server-side validation via global `ValidationPipe`
- Password policy: Uppercase + lowercase + digit + special char + 8+ chars (enforced in RegisterDto)

### Frontend (Next.js 15, React 19)

**Tech Stack:**
- **Framework:** Next.js 15.1 + React 19.2
- **Styling:** TailwindCSS v4 + Radix UI components
- **State Management:** React Context (auth), TanStack React Query (server state), Zustand (client state — AI chat)
- **Forms:** React Hook Form + zod validation
- **HTTP Client:** Axios with auto-refresh on 401 + CORS credentials
- **Real-time:** Socket.IO client for notifications/updates
- **Animations:** Framer Motion
- **Icons:** Lucide React

**Route Groups** (`frontend/src/app/`):

| Route Group | Auth Required | Purpose | Pages |
|---|---|---|---|
| **(auth)/** | ❌ No | Authentication flows | `/login`, `/register`, `/forgot-password`, `/reset-password`, OAuth callback |
| **(landing)/** | ❌ No | Public marketing | `/`, `/portfolio`, `/services`, `/about`, `/contact`, `/terms`, `/privacy` |
| **dashboard/** | ✅ OWNER/ADMIN | Owner/Admin workspace | Projects, tasks, invoicing, team management, client portal |
| **member/** | ✅ MEMBER | Team member workspace | My tasks, project participation, time tracking |
| **portal/** | ✅ CLIENT | Client self-service | View projects, tasks, invoices, communicate with team |
| **/api/** | — | Internal/proxy routes | — |
| **/verify-email/** | ❌ No | Email verification callback | Receives token, auto-verifies |

**Shared Libraries** (`frontend/src/lib/`):

- **api.ts** — Axios instance with:
  - Auto-token refresh (401 interceptor)
  - CORS credentials enabled
  - Failed queue for concurrent requests during refresh
  - Redirect to `/login` on final refresh failure
  
- **auth.tsx** — `AuthProvider` context:
  - Exposes: `user`, `login`, `logout`, `register`, `loginWithGoogle`, `refreshUser`
  - Computed: `isOwnerOrAdmin`, `isTeamMember`, `isClient`
  - Auto-init on mount via `/auth/me`
  
- **socket.tsx** — `SocketProvider` context:
  - Singleton Socket.IO connection with auto-reconnect
  - Event listeners: notifications, real-time updates
  
- **query-provider.tsx** — TanStack React Query setup

**Data Fetching Hooks** (`frontend/src/hooks/`):
- `use-projects.ts`, `use-tasks.ts`, `use-invoices.ts`, etc.
- React Query patterns: `useQuery`, `useMutation`, cache invalidation

**UI Components** (`frontend/src/components/`):
- Shared: header, footer, sidebar, form inputs
- Dashboard/Member/Portal: role-specific layouts
- Modal, tabs, dropdown, avatar, badge components (Radix + TailwindCSS)

**Bilingual Support (VI/EN):**
- User `locale` field (VI or EN)
- Server-side: `t(key, locale)` from `src/shared/utils/i18n.ts`
- Frontend: Locale passed to AI requests for bilingual responses

### Database Schema Highlights

**14 Prisma Models:**
- `User` — roles (OWNER/ADMIN/MEMBER/CLIENT), email verification, Google OAuth
- `Project` — currency (VND/USD), tech stack, portfolio showcase
- `Task` — hierarchical (subtasks), milestones, time entries, labels
- `Invoice` — line items, dual-currency, payment status
- `AiConversation` / `AiMessage` — chat history per user
- `AiUsageAudit` — token counts, cost, feature type (CHAT, PROPOSAL, etc.)
- `AiApplyRequest` — review workflow for AI-generated plans
- `Notification`, `Message`, `Comment`, `Attachment` — supporting data
- `SiteContent` — CMS sections (hero, services, testimonials)
- `WebPushSubscription` — device subscriptions for push notifications

**Enums (8 types):**
- `Language` (VI, EN)
- `Currency` (VND, USD)
- `UserRole` (OWNER, ADMIN, MEMBER, CLIENT)
- `ProjectStatus` (PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED)
- `TaskStatus` (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)
- `AiFeature` (CHAT, PROPOSAL, BREAK_DOWN, CODE_REVIEW, ESTIMATE, REPORT)
- `InvoiceStatus` (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- `NotificationType` (TASK_ASSIGNED, PROJECT_UPDATED, INVOICE_SENT, etc.)

## Security Architecture

**Authentication & Authorization:**
- ✅ JWT with HS256 (access 15m, refresh 7d)
- ✅ HttpOnly cookies (httpOnly, Secure in prod, SameSite: None/Lax)
- ✅ Refresh token stored hashed in DB (bcryptjs rounds 10)
- ✅ Email verification required for email/password users (Google OAuth auto-verified)
- ✅ OAuth 2.0 Google integration with state parameter
- ✅ Role-based access control (RBAC) via `@Roles()` + `RolesGuard`
- ✅ Per-resource authorization checks in service layer

**Data Security:**
- ✅ Password hashing: bcryptjs (12 rounds for new registrations)
- ✅ Sensitive data excluded from responses (password: _, refreshTokenHash: _)
- ✅ Prisma parameterization prevents SQL injection
- ✅ Input validation via class-validator + Global ValidationPipe with whitelist
- ✅ CORS scoped to FRONTEND_URL environment variable

**Network & Infrastructure Security:**
- ✅ Helmet.js for HTTP security headers (contentSecurityPolicy, etc.)
- ✅ Compression middleware for response size
- ✅ Rate limiting (100 req/60s globally via Redis throttler)
- ✅ Cookie domain restriction in production (.thongthaispace.com)
- ✅ Swagger only enabled on non-production (prevents API discovery)

**API Error Handling:**
- ✅ ValidationPipe rejects bad input with 400 Bad Request
- ✅ Auth failures return 401 Unauthorized
- ✅ Authorization failures return 403 Forbidden
- ✅ Not found returns 404 Not Found
- ⚠️ Prisma database errors sometimes leak error codes (P2025, P2003) — should normalize to generic 500

**Known Security Gaps (To Address):**
- ⚠️ `/auth/register` unprotected from rate limiting (spam/enumeration risk)
- ⚠️ Account overwrite vulnerability on unverified email (see code review findings)
- ⚠️ Content service accepts untyped JSON — potential for data corruption
- ⚠️ AI audit logging silently fails — blind spot for compliance/cost tracking

---

## Tech Stack Versions

| Component | Version | Purpose |
|---|---|---|
| **Backend** | NestJS 11.0.1 | Server framework |
| **Frontend** | Next.js 15.1.6 | React framework |
| **React** | 19.2.3 | UI library |
| **Database** | PostgreSQL 16 | Primary data store |
| **ORM** | Prisma 7.4.2 | Database abstraction |
| **Driver Adapter** | @prisma/adapter-pg 7.4.2 | PostgreSQL driver for Prisma |
| **Cache** | Redis 7 | Session, rate limit, Socket.IO store |
| **Real-time** | Socket.IO 4.8.3 | WebSocket layer |
| **Auth** | JWT (passport-jwt 4.0.1) | Access control |
| **OAuth** | passport-google-oauth20 2.0.0 | Social login |
| **API Requests** | Axios 1.13.6 | HTTP client (frontend) |
| **State Management** | React Query 5.90.21, Zustand | Data fetching & client state |
| **Form Validation** | React Hook Form 7.71.2, zod 4.3.6 | Form handling |
| **Styling** | TailwindCSS 4, Radix UI | Design system |
| **AI** | @anthropic-ai/sdk 0.78.0 | Claude integration |
| **Email** | Resend 6.9.4 | Transactional email |
| **File Storage** | @aws-sdk/client-s3 3.1009.0 | Cloudflare R2 uploads |
| **PDF Export** | pdfkit 0.18.0 | PDF generation |
| **Excel Export** | exceljs 4.4.0 | XLSX generation |
| **Word Export** | docx 9.6.1 | DOCX generation |
| **Testing** | Jest 30.0.0 (backend), Vitest 4.0.18 (frontend) | Test runners |
| **Linting** | ESLint 9.18.0 | Code quality |
| **Formatting** | Prettier 3.4.2 | Code formatting |

---

## Deployment Status

### Deployment-Ready ✅
- ✅ Docker Dockerfile for backend (multi-stage build with Prisma generation)
- ✅ Environment validation at startup (catches missing config early)
- ✅ Health check endpoint (`/api/health`)
- ✅ Swagger disabled in production
- ✅ Cookie domain scoping for multi-environment support
- ✅ VAPID key generation for Web Push (documented)
- ✅ Database migrations (Prisma migrate deploy)
- ✅ Redis adapter for Socket.IO horizontal scaling

### Deployment Platforms Tested
- ✅ **Railway** (backend deployed, active)
- ✅ **Vercel** (frontend deployed, active)
- ⚠️ **Docker Compose** (local & staging)

### Pre-Production Checklist
- ⚠️ Add structured logging (JSON format for ELK/CloudWatch)
- ⚠️ Add performance monitoring (APM agent: Datadog/New Relic)
- ⚠️ Add error tracking (Sentry integration)
- ⚠️ Add backup strategy for PostgreSQL
- ⚠️ Configure Redis persistence for sessions
- ⚠️ Set up HTTPS/SSL certificates (Let's Encrypt)
- ⚠️ Configure WAF rules if using CloudFlare
- ⚠️ Review AWS S3 / R2 bucket access policies
- ⚠️ Set up database read replicas for scaling

---

## Testing Coverage

| Layer | Status | Details |
|---|---|---|
| **Backend Unit Tests** | ✅ Partial | Services have `.spec.ts` (auth, user, project, task, etc.); controllers and guards less covered |
| **Backend E2E Tests** | ⚠️ Minimal | `test/auth.e2e-spec.ts` + `test/app.e2e-spec.ts` only; missing token refresh, CORS, multi-module flows |
| **Frontend Unit Tests** | ⚠️ Sparse | `src/lib/utils.test.ts`, `src/hooks/hooks.test.tsx` only; missing auth context, API interceptor tests |
| **Integration Tests** | ❌ None | No multi-module workflows (create project → assign → notify) |
| **E2E Browser Tests** | ❌ None | No Cypress/Playwright tests for full user flows |

### Test Commands
```bash
# Backend
cd backend
pnpm test                    # Jest unit tests
pnpm test:cov              # Coverage report
pnpm test:e2e              # E2E tests

# Frontend
cd frontend
pnpm test                  # Vitest single run
pnpm test:cov             # Coverage report
```

### Test Coverage Gaps
- ⚠️ Auth context token refresh race conditions
- ⚠️ Logout flow complete cleanup (cookies, tokens, state)
- ⚠️ Socket.IO connection/reconnection edge cases
- ⚠️ Error boundary handling for failed API calls
- ⚠️ Role-based access control across all endpoints
- ⚠️ Multi-currency calculations and rounding
- ⚠️ AI service error handling and fallbacks
- ⚠️ File upload with various file types/sizes

---

## Known Limitations & Technical Debt

| Issue | Severity | Status | Notes |
|---|---|---|---|
| Type erasure with `as any` in Task service | 🟠 High | ⚠️ Unfixed | Lines 75, 125 bypass Prisma type safety |
| Weak password policy for client creation | 🟠 High | ⚠️ Unfixed | Only 8 chars minimum, no regex enforcement |
| Content service untyped JSON input | 🟠 High | ⚠️ Unfixed | No schema validation on CMS data |
| AI service auth logging silently fails | 🟠 High | ⚠️ Unfixed | 8 bare catch blocks with no error logging |
| Account overwrite on unverified email | 🔴 Critical | ⚠️ Unfixed | Register endpoint allows profile updates |
| Frontend auth error suppression | 🟡 Medium | ⚠️ Unfixed | Silent catch in useEffect + init |
| Rate limiting on /auth/register | 🟡 Medium | ⚠️ Unfixed | Vulnerable to spam/enumeration |
| Prisma error code leakage | 🟡 Medium | ⚠️ Unfixed | P2025, P2003 codes visible in error responses |
| Test coverage fragmentation | 🟢 Low | ⚠️ Unfixed | Backend/frontend split, no integration tests |
| Swagger retention on staging | 🟢 Low | ⚠️ Current behavior | Enabled on non-prod only (ok for now) |

---

## Next Steps (Priority Order)

1. **Security hardening** — Fix account overwrite, add rate limit to register, fix AI audit logging
2. **Type safety** — Remove `as any` casts, add proper DTOs for content service
3. **Password policy** — Unify strong password rules across all endpoints
4. **Testing** — Add integration tests for auth flow, token refresh, logout
5. **Logging** — Structured logging + error tracking (Sentry)
6. **Monitoring** — APM setup + performance profiling
7. **Documentation** — API design docs, deployment runbooks, incident response playbooks

---

## Engineering Standards

> All AI-assisted code in this repo must follow these standards.
> Applies to: Claude Code, Cursor, and any AI agent working within this monorepo.

### Core Principles

**SOLID** — enforced on every class and module:
- **S** Single Responsibility — one reason to change per class/module
- **O** Open/Closed — extend via abstraction, never modify stable code
- **L** Liskov Substitution — subtypes must honor parent contracts
- **I** Interface Segregation — interfaces stay lean; no forced implementation
- **D** Dependency Inversion — inject dependencies, never instantiate services manually

**Design Patterns** — always name the pattern in a comment: `// Pattern: Repository`
- Structural: Repository (data access), Facade (module APIs), Decorator (interceptors)
- Behavioral: Strategy (auth guards), Observer (WebSocket events), Command (AI actions)
- Creational: Factory (dynamic modules), Singleton (NestJS scoped providers)

---

### Backend Rules (NestJS 11)

- Layered architecture strictly: `Controller → Service → Repository → Prisma`
- All DTOs must use `class-validator` + `class-transformer`
- Centralize error handling via `HttpExceptionFilter` — typed error classes only, never `throw new Error("string")`
- **Never use `as any`** — existing cases in Task service (lines 75, 125) are known tech debt; do not add new ones
- All Prisma queries inside Repository layer — never in Controllers or Services directly
- Detect N+1 queries — prefer `select` over `include` for performance-sensitive paths
- Multi-table writes must use `prisma.$transaction([])`
- Standard response envelope: `{ success, data, error, meta }`
- All public endpoints versioned: `/api/v1/`
- Rate limiting via `@nestjs/throttler` (Redis-backed — already configured)
- Never log tokens, passwords, or PII — existing AI audit silent-catch blocks are known debt

### Frontend Rules (Next.js 15 / React 19)

- RSC by default — use `"use client"` only for interactivity or browser hooks
- Data fetching: TanStack Query hooks in `hooks/` — never fetch directly in components
- Global state: Zustand in `stores/` — only for truly global state
- HTTP calls: always via `lib/api.ts` Axios instance — never raw `fetch` in components
- Forms: React Hook Form + Zod schema validation (already configured)
- Component limit: if > 150 lines, split into sub-components
- No silent catches in `useEffect` or init — surface errors visibly (known frontend debt)

### Security Rules

> See **Security Architecture** and **Known Security Gaps** sections above for current status.

- Validate all inputs at boundary (DTO / Zod schema)
- RBAC enforced via Guards — respect role hierarchy: `OWNER > ADMIN > MEMBER > CLIENT`
- Never hardcode secrets — always `process.env.VAR_NAME` via `ConfigModule`
- Do not add new unprotected endpoints to `/auth/` — existing `/auth/register` rate limit gap is tracked debt
- Normalize Prisma error codes before returning responses — do not expose P2025, P2003 to clients
- Content service data must have schema validation before writing — currently untyped (tracked debt)

### Testing Standards

> See **Testing Coverage** section above for current gaps.

- Unit tests: business logic in Services — colocate as `*.spec.ts`
- Integration tests: DB queries, API endpoints
- E2E: critical flows — auth, project CRUD, invoice lifecycle, token refresh
- Coverage target: ≥ 80% for core modules (`auth`, `project`, `task`, `invoice`, `ai`)
- Every new feature must include at minimum a unit test skeleton
- Priority gaps to fill: auth token refresh race conditions, logout cleanup, RBAC across endpoints

### Database / Migration Rules

- Migrations must be backward-compatible — never drop columns immediately
- Add new nullable columns first, migrate data, then enforce constraints
- Run `npx prisma generate` after every schema change
- Never run `migrate dev` on production — use `migrate deploy`
- Use `prisma.$transaction([])` for all multi-table writes

### Observability

> See **Pre-Production Checklist** for pending observability work.

- Structured JSON logging with request trace ID per request (pending — tracked in checklist)
- Log levels: `ERROR` (system faults) · `WARN` (recoverable) · `INFO` (business events) · `DEBUG` (dev only)
- Never log inside loops or hot paths
- Health check available at `/api/health`
- Sentry integration pending — do not add new silent catch blocks in the meantime

### CI/CD & Git

- Every PR must pass: `lint → type-check → test → build`
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Semantic versioning (semver) for all releases
- Docker: multi-stage builds already configured — no secrets in image layers
- Migrations run via `migrate deploy` in CD pipeline — never manually

### Tech Debt Policy

- Never hide tech debt — surface it explicitly
- Use inline markers: `// TECH DEBT: reason` or `// SIMPLIFIED: production should use X`
- Refer to **Known Limitations & Technical Debt** table above before adding new workarounds
- Do not add new `as any` casts — fix the type instead

### AI Agent Behavior (Claude Code / Cursor)

When generating or reviewing code in this repo:

1. State architecture approach in 1-2 lines before writing code
2. Name every non-trivial pattern with an inline comment: `// Pattern: Strategy`
3. Always include a test skeleton with new features
4. Cross-reference **Known Limitations** table — if touching a file with tracked debt, flag it
5. Cross-reference **Security Architecture** — call out any OWASP concern explicitly
6. If a standard is skipped for speed, mark it: `// TECH DEBT: <reason>`
7. Output format for code reviews:
```
✅ Follows: [what's good]
⚠️  Concern: [what to watch]
❌ Violation: [must fix + why]
```