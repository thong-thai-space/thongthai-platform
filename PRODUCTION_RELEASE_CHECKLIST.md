# Production Release Checklist

## 1. Secrets and Environment
- [ ] Copy `backend/.env.production.example` to `backend/.env.production`.
- [ ] Copy `frontend/.env.production.example` to `frontend/.env.production`.
- [ ] Set strong values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`.
- [ ] Set `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` to real domains.
- [ ] Confirm `NODE_ENV=production` in backend env.
- [ ] Verify no secrets are committed to git.

## 2. Pre-deploy Validation
- [ ] Backend test pass: `pnpm -C backend test -- --runInBand`.
- [ ] Backend build pass: `pnpm -C backend build`.
- [ ] Frontend test pass: `pnpm -C frontend test`.
- [ ] Frontend build pass: `pnpm -C frontend build`.
- [ ] Prisma migration status clean: `pnpm -C backend prisma migrate status`.
- [ ] Prepare proxy env: copy `deploy/nginx/.env.proxy.example` -> `deploy/nginx/.env.proxy`.
- [ ] Prepare backup env: copy `deploy/backup/.env.backup.example` -> `deploy/backup/.env.backup`.
- [ ] Prepare monitoring env: copy `deploy/monitoring/.env.monitoring.example` -> `deploy/monitoring/.env.monitoring`.

## 3. Deploy
- [ ] Create production env files locally/server.
- [ ] Start app stack: `docker compose -f docker-compose.prod.yml --env-file backend/.env.production up -d --build`.
- [ ] Start app stack + reverse proxy: `docker compose -f docker-compose.prod.yml -f deploy/nginx/docker-compose.proxy.yml --env-file backend/.env.production --env-file deploy/nginx/.env.proxy up -d --build`.
- [ ] Run first SSL issuance once: `bash deploy/nginx/scripts/init-letsencrypt.sh`.
- [ ] Check containers healthy: `docker compose -f docker-compose.prod.yml ps`.
- [ ] Check backend liveness: `GET /api/health/live`.
- [ ] Check backend readiness: `GET /api/health/ready`.
- [ ] Check frontend health: `GET /api/health`.

## 4. Smoke Test
- [ ] Login/logout works with HttpOnly cookies.
- [ ] Token refresh works after access token expiry.
- [ ] Role routing works: OWNER/ADMIN -> `/dashboard`, MEMBER -> `/member`, CLIENT -> `/portal`.
- [ ] Core APIs respond: projects/tasks/invoices/messages.
- [ ] WebSocket notifications connect and receive events.
- [ ] File upload and public file serving (`/uploads`) works.

## 5. Post-deploy Monitoring
- [ ] Start monitoring stack: `docker compose -f docker-compose.prod.yml -f deploy/monitoring/docker-compose.monitoring.yml --env-file backend/.env.production --env-file deploy/monitoring/.env.monitoring up -d`.
- [ ] Configure uptime check for:
  - [ ] `https://YOUR_DOMAIN/`
  - [ ] `https://YOUR_DOMAIN/api/health/live`
  - [ ] `https://YOUR_DOMAIN/api/health/ready`
- [ ] Configure notification channels in Uptime Kuma (Telegram/Slack/Email).
- [ ] Configure alert receivers in `deploy/monitoring/alertmanager/alertmanager.yml`.
- [ ] Verify Prometheus targets are up (`/targets`).
- [ ] Verify DB disk usage and backup job schedule.

## 6. Backup and Restore
- [ ] Run first backup manually: `bash deploy/backup/backup-postgres.sh`.
- [ ] Verify dump file exists in configured `BACKUP_DIR`.
- [ ] Test restore in a safe environment: `bash deploy/backup/restore-postgres.sh <dump_file>`.
- [ ] Add daily cron for backup script.
- [ ] Add daily/weekly cron for SSL renew script: `bash deploy/nginx/scripts/renew-letsencrypt.sh`.

## 7. Rollback Plan
- [ ] Keep previous image tags available.
- [ ] Keep previous env snapshot in secure vault.
- [ ] Rollback command prepared (redeploy previous image tags).
- [ ] Team knows rollback owner and communication channel.
