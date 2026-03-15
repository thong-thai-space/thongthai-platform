# Thông Thái Space — Copilot Instructions

## Project
Vietnamese tech company platform (web/app + AI). Monorepo: `backend/` (NestJS) + `frontend/` (Next.js).

## Stack
- **Backend**: NestJS 11.x, Prisma 7.x, PostgreSQL 16, Redis 7
- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui, React Query
- **AI**: Anthropic Claude Sonnet via `@anthropic-ai/sdk`
- **Package Manager**: pnpm (both backend & frontend)

## Prisma 7.x — CRITICAL
- NO `url` in datasource block — configured in `prisma.config.ts`
- PrismaClient uses driver adapter: `@prisma/adapter-pg` with `PrismaPg`
- Do NOT use `datasourceUrl` — use adapter pattern in `prisma/prisma.service.ts`
- Generated client at `backend/generated/prisma/`
- Prisma Studio may not work with this config

## Backend Conventions
- 10 modules: Auth, User, Project, Task, Client, Invoice, Portfolio, Ai, Notification, File
- Module structure: `module.ts` → `controller.ts` → `service.ts` → `dto/`
- Auth: JWT accessToken (15m) + refreshToken (7d)
- Roles: OWNER, ADMIN, MEMBER, CLIENT — use `@Roles()` decorator + `RolesGuard`
- Current user: `@CurrentUser()` param decorator
- Validation: `class-validator` DTOs with `ValidationPipe`
- All endpoints prefixed `/api` (global prefix in main.ts)

## Bilingual Support (VI/EN)
- User has `locale` field (default: `VI`)
- Use `t(key, locale)` from `src/shared/utils/i18n.ts` for server messages
- Use `formatCurrency(amount, currency)` for money display
- AI prompts respond in the user's language
- Project & Invoice support dual currency: VND + USD

## Frontend Conventions
- API client: `src/lib/api.ts` — Axios with auto-token attach + 401 refresh
- Auth: `src/lib/auth.tsx` — AuthProvider context (login/register/logout/me)
- React Query hooks: `src/hooks/use-*.ts` pattern
- Types: `src/types/index.ts` — mirrors backend Prisma models
- Design tokens: primary blue (`#2563EB`), accent amber (`#F59E0B`)
- Route groups: `(landing)/` for public, `dashboard/` for internal, `portal/` for clients

## Database
- Docker: `docker-compose.yml` at root (PostgreSQL + Redis)
- DB: thongthai_space, User: thongthai, Port: 5432
- 14 models, 8 enums (including Language VI/EN, Currency VND/USD)

## Communication
- User prefers Vietnamese explanations
- Step-by-step with tables when explaining concepts
- Tests APIs on Postman (workspace: "Thông Thái Space")
