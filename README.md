# Thông Thái Space Platform

A Vietnamese SaaS platform for managing freelance projects, with AI-assisted planning, proposals, task breakdowns, and strategic guidance.

## Key Features

- JWT authentication + Google OAuth with refresh tokens
- Project, task, client, and invoice management (multi-currency VND/USD)
- AI assistant (chat, proposal, estimate, code review)
- Realtime notifications + Web Push
- File uploads (local or Cloudflare R2)
- Client portal and public portfolio

## Repository Structure

```
backend/    NestJS 11 + Prisma 7 + PostgreSQL + Redis
frontend/   Next.js 15 + React 19 + TailwindCSS v4
docs/       Documentation
deploy/     Infrastructure & deployment configs
nginx/      Nginx configs
```

## Requirements

- Node.js 20+
- pnpm
- Docker (PostgreSQL + Redis)

## Quick Start (Local)

```bash
# 1. Infrastructure
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
pnpm install
npx prisma migrate dev
pnpm start:dev

# 3. Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev
```

Access:
- Frontend: http://localhost:3000  
- Backend API: http://localhost:4000/api  
- Swagger (non-prod): http://localhost:4000/api/docs

## Common Scripts

### Backend
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm start:dev`

### Frontend
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm dev`

## Environment Configuration

- Backend: see `backend/.env.example`
- Frontend: create `frontend/.env.local`
  - `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000/api`)
  - `NEXT_PUBLIC_SOCKET_URL` (default: `http://localhost:4000`)

## Deployment

See `docs/` and `deploy/` for deployment checklists and infrastructure configuration.

## License

UNLICENSED
