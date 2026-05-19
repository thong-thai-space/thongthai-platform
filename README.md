# Thông Thái Space Platform

Nền tảng SaaS dành cho freelancer/agency Việt Nam để quản lý dự án, khách hàng và hóa đơn, tích hợp AI hỗ trợ lập kế hoạch, tạo proposal, tách việc và tư vấn chiến lược.

> Monorepo gồm **backend (NestJS)** và **frontend (Next.js)**.

## Tính năng chính

- Xác thực JWT (access 15m, refresh 7d) + Google OAuth
- Quản lý dự án, công việc, khách hàng, hóa đơn (đa tiền tệ VND/USD)
- AI assistant (chat, proposal, estimate, code review)
- Thông báo realtime + Web Push
- Upload file (local hoặc Cloudflare R2)
- Client portal & portfolio công khai

## Cấu trúc thư mục

```
backend/    NestJS 11 + Prisma 7 + PostgreSQL + Redis
frontend/   Next.js 15 + React 19 + TailwindCSS + shadcn/ui
docs/       Tài liệu
deploy/     Hạ tầng & cấu hình triển khai
nginx/      Cấu hình Nginx
```

## Yêu cầu hệ thống

- Node.js 20+
- pnpm
- Docker (PostgreSQL + Redis)

## Khởi chạy nhanh (Local)

```bash
# 1) Hạ tầng
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env
pnpm install
npx prisma migrate dev
pnpm start:dev

# 3) Frontend (terminal khác)
cd frontend
pnpm install
pnpm dev
```

Truy cập:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Swagger (non-prod): http://localhost:4000/api/docs

## Cấu hình môi trường

- Backend: xem `backend/.env.example`
- Frontend: tạo `frontend/.env.local`
  - `NEXT_PUBLIC_API_URL` (mặc định: `http://localhost:4000/api`)
  - `NEXT_PUBLIC_SOCKET_URL` (mặc định: `http://localhost:4000`)

## Prisma 7.x (Lưu ý quan trọng)

- **Không** khai báo `url` trong `datasource` (được cấu hình trong `prisma.config.ts`).
- PrismaClient dùng **driver adapter**: `@prisma/adapter-pg` với `PrismaPg`.
- **Không** dùng `datasourceUrl` — dùng adapter trong `prisma/prisma.service.ts`.
- Generated client tại: `backend/generated/prisma/`.
- Prisma Studio có thể không hoạt động với cấu hình này.

## Scripts thường dùng

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

## Tài liệu & triển khai

- Xem thư mục `docs/` và `deploy/` để biết checklist triển khai và cấu hình hạ tầng.

## License

UNLICENSED
