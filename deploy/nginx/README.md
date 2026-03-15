# Nginx Reverse Proxy + SSL

This setup puts Nginx in front of frontend and backend, terminates TLS, and proxies:

- `/` -> frontend service
- `/api/*`, `/socket.io/*`, `/uploads/*` -> backend service

## 1. Prepare env

Copy env template and fill real values:

```bash
cp deploy/nginx/.env.proxy.example deploy/nginx/.env.proxy
```

## 2. Issue first certificate

Run once (after backend/frontend env files are ready):

```bash
bash deploy/nginx/scripts/init-letsencrypt.sh
```

## 3. Start production stack with proxy

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f deploy/nginx/docker-compose.proxy.yml \
  --env-file backend/.env.production \
  --env-file deploy/nginx/.env.proxy \
  up -d --build
```

## 4. Renew certificate

Run manually:

```bash
bash deploy/nginx/scripts/renew-letsencrypt.sh
```

Suggested cron job (Linux):

```cron
0 3 * * * cd /opt/thongthai && bash deploy/nginx/scripts/renew-letsencrypt.sh >> /var/log/thongthai-certbot-renew.log 2>&1
```
