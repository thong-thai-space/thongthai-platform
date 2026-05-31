# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project

**Thông Thái Space** — Vietnamese tech freelance project management SaaS with AI features.
Monorepo: `backend/` (NestJS 11 + Prisma 7 + PostgreSQL + Redis) · `frontend/` (Next.js 15 + React 19 + Tailwind v4).

## Product & Roadmap

Full business plan: **`docs/restructuring-plan.md`** (service catalog, pricing, rationale). Summary of what affects engineering decisions:

**Operating model.** Solo founder. The "phòng/teams" in the plan are functional hats worn by one person + AI tools — not staffed departments. The scarcest resource is *founder time*, not cash (break-even ≈ 1 small audit/month). Optimize accordingly: avoid premature structure, prefer incremental work over rebuilds.

**Three-phase roadmap (2026)** — build in this order; do NOT pull later scope forward:

| Phase | Months | Build focus | Modules in scope |
|---|---|---|---|
| GĐ1 | T1–4 | Public site + SEO + lead capture + identity | `content`, `contact`, `portfolio`, `auth`, `user` |
| GĐ2 | T5–8 | AI Core (RAG MVP) + ops/billing + academy — serve pilot SMEs | `ai`, `project`, `task`, `invoice`, `export` |
| GĐ3 | T9–12 | Multi-tenant SaaS packaging + community + meeting assistant | subscription, community — *not yet built* |

**Plan modules ↔ codebase modules.** The plan's logical modules already map onto existing code — this is incremental work, not a greenfield rebuild:

- Public & CMS → `content`, `contact`, `portfolio`
- CRM → `client`, `project`
- Ops & Billing ("ERP nhẹ") → `project`, `task`, `invoice`, `export`
- AI Core → `ai`
- Identity → `auth`, `user`
- Academy · Community · Subscription → **not yet built** (GĐ2/GĐ3)

**Scope discipline (plan §6.5).**
- "Mạng xã hội" is deliberately reduced to **blog + simple community feed** — do NOT build a real social network.
- Meeting/consult assistant (real-time audio → dynamic cards) is **GĐ3 only** — keep it out of earlier scope.
- Modular monolith, never microservices — one person cannot operate microservices.

**Provider neutrality (plan §6.4).** The product's core promise is vendor-neutral advice. Current code uses the Anthropic SDK only. Direction: the `ai` module should evolve toward a **Provider Router** — one port, swappable adapters (Claude / OpenAI / Gemini). Shape new AI code as adapter-friendly so a 2nd provider stays cheap to add — but YAGNI applies: add the 2nd adapter when a 2nd provider is actually needed. RAG (GĐ2) will use **pgvector** (Postgres extension), not a separate vector DB.

**Human-in-the-loop (plan §3.4, §5.2).** AI assists, the human decides — no fully-autonomous "AI employees." Every AI-generated output (quotes, plans, content, RAG answers) must be reviewable/approvable before it takes effect. Accounting/tax flows are never auto-executed. (See the existing `ai-strategic-plan.use-case.ts` Saga — already built this way.)

## Commands

Run from `backend/` or `frontend/` as appropriate. Package manager: **pnpm**.

### Backend
```bash
pnpm start:dev       # Dev server (port 4000, hot-reload)
pnpm build           # nest build
pnpm test            # Jest unit tests
pnpm test:cov        # Coverage report
pnpm test:e2e        # E2E tests
pnpm lint            # ESLint auto-fix
```

Single test: `pnpm test -- --testPathPatterns=auth.use-case`

### Frontend
```bash
pnpm dev             # Dev server (port 3000)
pnpm build           # Next.js production build
pnpm test            # Vitest
```

### Database (from `backend/`)
```bash
npx prisma generate                            # Regen client after schema change
npx prisma migrate dev --name <description>    # Create + apply migration
npx prisma migrate deploy                      # Production
npx prisma studio                              # GUI on :5555
```

### Infrastructure
```bash
docker compose up -d                  # All services
docker compose --profile tools up -d  # + pgAdmin on :5050
```

### Local workflow
```bash
docker compose up -d                          # 1. Postgres + Redis
cd backend && cp .env.example .env            # 2. Configure
pnpm install && npx prisma migrate dev        # 3. Setup
pnpm start:dev                                # 4. Run backend
cd ../frontend && pnpm install && pnpm dev    # 5. Run frontend
```

URLs: Frontend http://localhost:3000 · API http://localhost:4000/api/v1 · Swagger http://localhost:4000/api/v1/docs · Health probe http://localhost:4000/api/healthz

## Environment

`backend/.env` — see `backend/.env.example`. Required:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development \| test \| production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | 32+ char signing keys (access 15m / refresh 7d) |
| `REDIS_URL` | Cache + rate limit + Socket.IO adapter |
| `ANTHROPIC_API_KEY` | Claude AI integration |
| `PORT` | API port (default 4000) |
| `FRONTEND_URL` | CORS origin |

Feature-gated (enable as needed): `STORAGE_PROVIDER=r2` (+ R2 keys), `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `VAPID_*` (push notifications), `TURNSTILE_SECRET` (bot protection), `VOYAGE_API_KEY` (RAG embeddings — standalone Voyage key, not MongoDB Atlas; RAG disabled when blank).

`frontend/.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.

## Architecture

### Backend — Clean Architecture (per module)

Each business module follows the same layout:

```
modules/<name>/
├── domain/             # Ports (interfaces) + types — depends on nothing
├── policies/           # Business rules (state machines, validators, authz)
├── use-cases/          # Application logic (1 class per cohesive flow)
├── adapters/           # Concrete implementations of ports
├── repositories/       # Prisma-backed Repository implementing the port
├── dto/                # Request DTOs with class-validator
├── <name>.constants.ts # DI symbols + magic numbers
├── <name>.module.ts    # Composition Root — binds ports to adapters
├── <name>.service.ts   # Thin Facade — controller-facing API
└── <name>.controller.ts
```

**Modules** (`backend/src/modules/`): auth, user, project, task, client, invoice, ai, notification, message, file, portfolio, contact, content, export, health, email, security.

### Frontend (Next.js 15, React 19)

- **Routing**: `app/` with route groups — `(auth)/`, `(landing)/`, `dashboard/`, `member/`, `portal/`
- **Data**: TanStack React Query hooks in `hooks/` — never `fetch` in components
- **State**: Zustand for global; Context only for auth/socket
- **HTTP**: Axios in `lib/api.ts` with auto-refresh on 401
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.IO client (singleton in `lib/socket.tsx`)

### Database

PostgreSQL 16 via Prisma 7 with `@prisma/adapter-pg` (driver adapter — no `url` in datasource).
Roles: `OWNER > ADMIN > MEMBER > CLIENT`. Enforced via `@Roles()` + `RolesGuard`.
14 models. Enums: `Language`, `Currency`, `UserRole`, `ProjectStatus`, `TaskStatus`, `InvoiceStatus`, `NotificationType`, `AiFeature`.

## Engineering Judgment

The rules in **Engineering Standards** are _heuristics_, not commandments. Apply them with judgment:

| Guideline | Scale | When to relax |
|---|---|---|
| Clean Code | Line / function | Never — always write readable code |
| OOP / encapsulation | Class | Simple data containers; pure FP pipelines |
| SOLID | Class relationships | One-off scripts; throwaway admin pages |
| Clean Architecture layers | System / module | Simple CRUD with no domain logic |
| 150-line component limit | File | Sequential flows where splitting hurts locality |
| ≥80% test coverage | Use-case | UI-only presentational components |

**Scale ordering** — Clean Code → OOP → SOLID → Clean Architecture are four _different scales_, not a sequential hierarchy. You can write Clean Code without OOP. SOLID should be applied before Clean Architecture because class-relationship decisions are cheaper to undo than cross-module boundary decisions.

**Rigor scales with blast radius.** A shared use case touched by every consumer deserves ports, tests, and strict layering. A one-off admin widget called from one place — keep it simple.

**YAGNI.** Don't introduce abstractions before the second real use case. The cost to add structure later is lower than the cost to carry premature structure forever.

## Engineering Standards

### SOLID + patterns (mandatory)
- **Single Responsibility**: 1 class = 1 reason to change. Split fat services into use cases.
- **Dependency Inversion**: inject ports via DI symbols. Never `new Service()`.
- **Name patterns inline**: `// Pattern: Repository`, `// Pattern: State Machine`, etc.

### Backend rules
- Layered: `Controller → Service (Facade) → UseCase → Port → Repository → Prisma`. Never call Prisma from controllers or use cases directly.
- **DTOs**: class-validator + class-transformer. Global `ValidationPipe` rejects anything not whitelisted.
- **Errors**: throw typed `HttpException` subclasses (`NotFoundException`, `ConflictException`, etc.). Never `throw new Error("string")`. Repositories must map Prisma codes (P2002, P2025) to typed exceptions — don't leak codes to clients.
- **Never `as any`**. (Existing `as any` in `task.service.ts:75,125` is tracked tech debt.)
- **Multi-table writes**: `prisma.$transaction([...])`.
- **Rate limiting**: `@nestjs/throttler` (Redis-backed, already configured).
- **N+1**: prefer `select` over `include` for hot paths.
- **Logging**: never log tokens, passwords, or PII. Audit-log silent catches must call `Logger.warn()` with reason.

### Frontend rules
- **Server Components by default** — `"use client"` only when needed.
- **No raw fetch in components** — use `lib/api.ts`.
- **No silent catches in `useEffect`/init** — surface errors.
- **Component > 150 lines** → consider splitting. Prefer splitting when the component has multiple independent concerns; keep together when lines share tight sequential context (see Engineering Judgment above).

### Security
- RBAC via Guards + service-layer ownership checks.
- Password policy: 8+ chars, upper + lower + digit + special. Enforced by `PasswordPolicy` (auth) and equivalent in user/client modules.
- HttpOnly cookies (Secure + SameSite in prod). Refresh token stored hashed (bcrypt 10 rounds).
- Email verification required for email/password users; Google OAuth auto-verified.
- Cloudflare Turnstile gates auth endpoints when `TURNSTILE_SECRET` is set.
- Helmet, CORS scoped to `FRONTEND_URL`, no secrets in error responses.

### Testing
- **Unit**: colocate as `*.spec.ts` alongside use cases / policies. Test against **ports**, not concrete impls.
- **Coverage target**: ≥80% for use cases of `auth`, `project`, `task`, `invoice`, `ai`.
- **Single test**: `pnpm test -- --testPathPatterns=<pattern>`
- E2E: `pnpm test:e2e` (Jest).

### DB / Migrations
- Migrations backward-compatible: add nullable column → backfill → enforce.
- Run `npx prisma generate` after schema change.
- **Never** `migrate dev` on production — use `migrate deploy`.

### Git / CI
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Every PR: `lint → type-check → test → build`.
- Never `--no-verify` or skip signing.

### Tech debt
- Mark with `// TECH DEBT: <reason>` — don't hide it.
- See **Known limitations** below.

## Known limitations

| Issue | Severity | Notes |
|---|---|---|
| `portfolio`, `health`, `email`, `export`, `security` modules | 🟢 | Repository-only (no `domain/` + `use-cases/`); functional but inconsistent with the rest |
| Frontend untouched in current refactor | 🟢 | Backend Clean Arch done — frontend follow-up pending |
| No integration / E2E tests for cross-module flows | 🟡 | Only unit tests at use-case level today |
| No Sentry / structured JSON logging | 🟡 | Pre-production checklist |
| Strategic-plan apply uses Saga (idempotent), not `$transaction` | 🟢 | Intentional: avoids long-running locks. Documented in `ai-strategic-plan.use-case.ts` |

## Tech stack reference

NestJS 11 · Next.js 15.1 · React 19 · Prisma 7.7 · PostgreSQL 16 · Redis 7 · Socket.IO 4 · JWT (passport) · bcryptjs · TailwindCSS 4 · Radix UI · TanStack Query 5 · Zustand · React Hook Form + Zod · Anthropic SDK 0.78 · Resend (email) · @aws-sdk/client-s3 (R2) · pdfkit · exceljs · docx · Jest 30 · Vitest 4.

## AI agent behavior (Claude Code, Cursor)

When generating or reviewing code:
1. State your architectural approach in 1–2 lines before writing.
2. Name every non-trivial pattern inline: `// Pattern: Strategy`.
3. Place new code in the correct layer — never put Prisma in a controller, never put HTTP concerns in a use case.
4. Add at least a test skeleton with new features.
5. Cross-reference **Known limitations** before adding new workarounds.
6. Code review output format:
   ```
   ✅ Follows: [...]
   ⚠️  Concern: [...]
   ❌ Violation: [must fix + why]
   ```