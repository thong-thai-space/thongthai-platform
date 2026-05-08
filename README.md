# Thông Thái Space Platform

Nền tảng SaaS quản lý dự án freelance tại Việt Nam, tích hợp AI để hỗ trợ lập kế hoạch, báo giá, breakdown công việc và tư vấn chiến lược.

## Tính năng chính

- Xác thực JWT + Google OAuth, refresh token
- Quản lý dự án, task, client, invoice (đa tiền tệ VND/USD)
- AI assistant (chat, proposal, estimate, code review)
- Thông báo realtime + Web Push
- Upload file (local hoặc Cloudflare R2)
- Client portal và portfolio công khai

## Cấu trúc repo

```
backend/    NestJS 11 + Prisma 7 + PostgreSQL + Redis
frontend/   Next.js 15 + React 19 + TailwindCSS v4
docs/       Tài liệu triển khai
deploy/     Hạ tầng & cấu hình deploy
nginx/      Cấu hình Nginx
```

## Yêu cầu

- Node.js 20+
- pnpm
- Docker (PostgreSQL + Redis)

## Cài đặt nhanh (Local)

```bash
# 1. Hạ tầng
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
pnpm install
npx prisma migrate dev
pnpm start:dev

# 3. Frontend (terminal khác)
cd frontend
pnpm install
pnpm dev
```

Truy cập:
- Frontend: http://localhost:3000  
- Backend API: http://localhost:4000/api  
- Swagger (non-prod): http://localhost:4000/api/docs

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

## Cấu hình môi trường

- Backend: xem `backend/.env.example`
- Frontend: tạo `frontend/.env.local`
  - `NEXT_PUBLIC_API_URL` (mặc định: `http://localhost:4000/api`)
  - `NEXT_PUBLIC_SOCKET_URL` (mặc định: `http://localhost:4000`)

## Triển khai

Tham khảo thư mục `docs/` và `deploy/` cho checklist triển khai GCP/AWS và cấu hình hạ tầng.

## License

UNLICENSED
