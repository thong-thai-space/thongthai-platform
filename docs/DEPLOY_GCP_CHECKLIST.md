# ThongThaiSpace - Google Cloud Platform Deployment Checklist

> Checklist chi tiet tung buoc deploy ThongThaiSpace len GCP cho ca Production va Development.
> Region khuyen nghi: `asia-southeast1` (Singapore - gan Viet Nam nhat).

---

## Thong tin ky thuat tu codebase

| Thanh phan | Chi tiet |
|---|---|
| **Backend** | NestJS 11, port 4000, Docker multi-stage (node:20-alpine) |
| **Frontend** | Next.js 15 standalone, port 3000, Docker multi-stage (node:20-alpine) |
| **Database** | PostgreSQL 16 (Prisma 7 ORM, 14 models, 10 migrations) |
| **Cache** | Redis 7 (Keyv caching, Throttler rate-limit, Socket.IO adapter) |
| **WebSocket** | Socket.IO v4 voi Redis adapter (can WebSocket upgrade tai LB) |
| **File Storage** | Local `/uploads` hoac S3-compatible (Cloudflare R2 / GCS) |
| **Health checks** | Backend: `/api/health/live` (liveness), `/api/health/ready` (readiness DB+Redis). Frontend: `/api/health` |
| **Routing (nginx)** | `/api/*`, `/socket.io/*`, `/uploads/*` -> backend:4000. Con lai -> frontend:3000 |
| **Auth** | JWT HS256 (access 15m, refresh 7d), HttpOnly cookies, Google OAuth 2.0 |
| **Cookie domain** | `.thongthaispace.com` (production) |
| **Rate limiting** | 100 req/60s (Redis-backed Throttler) |
| **Entrypoint** | `prisma migrate deploy` truoc khi start `node dist/src/main.js` |

### Environment Variables (Backend - Required)
```
NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY,
REDIS_URL, FRONTEND_URL, PORT (default: 4000)
```

### Environment Variables (Backend - Optional)
```
STORAGE_PROVIDER (local|r2), R2_*, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
GOOGLE_CALLBACK_URL, RESEND_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
VAPID_SUBJECT, JWT_EXPIRES_IN (15m), JWT_REFRESH_EXPIRES_IN (7d)
```

### Environment Variables (Frontend - Build-time)
```
NEXT_PUBLIC_API_URL=https://api.thongthaispace.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.thongthaispace.com
```

---

## Section 1: Prerequisites

### 1.1 GCP Account va Billing
- [ ] Tao tai khoan GCP tai https://cloud.google.com
- [ ] Thiet lap billing account va lien ket phuong thuc thanh toan
- [ ] Bat budget alerts tai $50, $100, $200/thang
  - Console: Billing > Budgets & alerts > Create budget
- [ ] Luu y: Tai khoan moi duoc $300 free credits trong 90 ngay

### 1.2 Cai dat CLI Tools
- [ ] Cai Google Cloud SDK (gcloud CLI): https://cloud.google.com/sdk/docs/install
  ```bash
  gcloud version
  ```
- [ ] Cai Docker Desktop (de build images locally)
- [ ] Cai `psql` client (de kiem tra database)
- [ ] Cai `redis-cli` (de kiem tra cache)

### 1.3 Tao GCP Projects
- [ ] Tao project Production
  ```bash
  gcloud projects create thongthaispace-prod --name="ThongThaiSpace Production"
  gcloud config set project thongthaispace-prod
  ```
- [ ] Tao project Development
  ```bash
  gcloud projects create thongthaispace-dev --name="ThongThaiSpace Development"
  ```
- [ ] Lien ket billing account
  ```bash
  gcloud billing projects link thongthaispace-prod --billing-account=BILLING_ACCOUNT_ID
  gcloud billing projects link thongthaispace-dev --billing-account=BILLING_ACCOUNT_ID
  ```

### 1.4 Bat cac APIs can thiet
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com \
  dns.googleapis.com \
  cloudresourcemanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  storage.googleapis.com \
  certificatemanager.googleapis.com
```
> **Tai sao:** Moi GCP service can bat API rieng. Thieu se bi loi permission kho hieu.

### 1.5 IAM Setup
- [ ] Tao service account cho CI/CD
  ```bash
  gcloud iam service-accounts create cicd-deployer \
    --display-name="CI/CD Deployer"
  ```
- [ ] Cap quyen toi thieu
  ```bash
  PROJECT_ID=thongthaispace-prod
  SA_EMAIL=cicd-deployer@${PROJECT_ID}.iam.gserviceaccount.com

  for ROLE in \
    roles/run.admin \
    roles/artifactregistry.writer \
    roles/secretmanager.secretAccessor \
    roles/iam.serviceAccountUser \
    roles/cloudbuild.builds.builder \
    roles/storage.objectAdmin; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:$SA_EMAIL" \
      --role="$ROLE"
  done
  ```
- [ ] Tao key cho GitHub Actions (hoac dung Workload Identity Federation - khuyen nghi)
  ```bash
  # Option A: JSON key (don gian hon, kem bao mat)
  gcloud iam service-accounts keys create key.json \
    --iam-account=$SA_EMAIL

  # Option B: Workload Identity Federation (khuyen nghi - xem Section 12)
  ```

> **Luu y:** KHONG BAO GIO commit `key.json` vao repo. Luu lam GitHub secret.

---

## Section 2: Networking Setup

### 2.1 Tao VPC Network
```bash
gcloud compute networks create thongthaispace-vpc \
  --subnet-mode=custom \
  --project=thongthaispace-prod

gcloud compute networks subnets create thongthaispace-subnet \
  --network=thongthaispace-vpc \
  --region=asia-southeast1 \
  --range=10.0.0.0/20
```

### 2.2 Serverless VPC Access Connector
Cloud Run can VPC connector de ket noi Cloud SQL va Memorystore (nam trong VPC).
```bash
gcloud compute networks vpc-access connectors create thongthaispace-connector \
  --region=asia-southeast1 \
  --network=thongthaispace-vpc \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=f1-micro
```
> **Luu y:** IP range `10.8.0.0/28` KHONG duoc trung voi subnet nao khac.

### 2.3 Private Service Connection (cho Cloud SQL)
```bash
gcloud compute addresses create google-managed-services-thongthaispace \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=thongthaispace-vpc

gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-thongthaispace \
  --network=thongthaispace-vpc
```

### 2.4 Firewall Rules
```bash
# Cho phep giao tiep noi bo trong VPC
gcloud compute firewall-rules create allow-internal \
  --network=thongthaispace-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/20,10.8.0.0/28

# Chan tat ca ingress (Cloud Run tu xu ly ingress)
gcloud compute firewall-rules create deny-all-ingress \
  --network=thongthaispace-vpc \
  --direction=INGRESS \
  --action=DENY \
  --rules=all \
  --priority=65534
```

---

## Section 3: Database Setup (Cloud SQL for PostgreSQL 16)

### 3.1 Tao Cloud SQL Instance (Production)
```bash
gcloud sql instances create thongthaispace-db-prod \
  --database-version=POSTGRES_16 \
  --tier=db-custom-1-3840 \
  --region=asia-southeast1 \
  --network=projects/thongthaispace-prod/global/networks/thongthaispace-vpc \
  --no-assign-ip \
  --storage-type=SSD \
  --storage-size=20GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --availability-type=zonal \
  --database-flags=max_connections=100,log_min_duration_statement=1000 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=05 \
  --deletion-protection
```

**Giai thich cau hinh:**
- `db-custom-1-3840`: 1 vCPU, 3.75 GB RAM - du cho production ban dau
- `--no-assign-ip`: Chi private IP, khong public
- `--storage-auto-increase`: Tu dong tang disk khi gan day
- `--backup-start-time=03:00`: Backup tu dong luc 3h sang UTC moi ngay
- `--deletion-protection`: Chong xoa nham

> **Luu y:** Tao Cloud SQL mat 5-10 phut. `--no-assign-ip` nghia la PHAI dung VPC connector hoac Cloud SQL Auth Proxy de ket noi.

### 3.2 Tao Database va User
```bash
gcloud sql databases create thongthai_space \
  --instance=thongthaispace-db-prod

DB_PASSWORD=$(openssl rand -base64 32)
echo "Luu mat khau nay an toan: $DB_PASSWORD"

gcloud sql users create thongthai \
  --instance=thongthaispace-db-prod \
  --password=$DB_PASSWORD
```

### 3.3 Lay thong tin ket noi
```bash
gcloud sql instances describe thongthaispace-db-prod \
  --format="get(ipAddresses[0].ipAddress)"
```
DATABASE_URL se la:
```
postgresql://thongthai:PASSWORD@PRIVATE_IP:5432/thongthai_space?schema=public
```

### 3.4 Luu DATABASE_URL vao Secret Manager
```bash
echo -n "postgresql://thongthai:${DB_PASSWORD}@PRIVATE_IP:5432/thongthai_space?schema=public" | \
  gcloud secrets create DATABASE_URL --data-file=-

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### 3.5 Chay Migration lan dau
Dung Cloud SQL Auth Proxy de ket noi tu local:
```bash
# Tai Cloud SQL Auth Proxy
# https://cloud.google.com/sql/docs/postgres/sql-proxy

# Khoi dong proxy
cloud-sql-proxy thongthaispace-prod:asia-southeast1:thongthaispace-db-prod \
  --port=5432

# Tai terminal khac, tu thu muc backend/:
DATABASE_URL="postgresql://thongthai:PASSWORD@127.0.0.1:5432/thongthai_space?schema=public" \
  npx prisma migrate deploy
```
> **Luu y:** Entrypoint.sh chay migration moi khi container start, nhung kiem tra lan dau bang tay de dam bao thanh cong.
> **Prisma safety:** `prisma.config.ts` chan cac lenh nguy hiem tren Railway URL. Dam bao chi dung `migrate deploy` (an toan), KHONG DUNG `migrate dev` tren production.

---

## Section 4: Cache Setup (Memorystore for Redis 7)

### 4.1 Tao Memorystore Redis Instance (Production)
```bash
gcloud redis instances create thongthaispace-redis-prod \
  --size=1 \
  --region=asia-southeast1 \
  --zone=asia-southeast1-a \
  --network=projects/thongthaispace-prod/global/networks/thongthaispace-vpc \
  --redis-version=redis_7_2 \
  --tier=basic \
  --display-name="ThongThaiSpace Redis Production"
```
- `--size=1`: 1 GB memory. Du cho caching (Keyv), rate limiting (Throttler 100 req/60s), Socket.IO adapter pub/sub
- `--tier=basic`: Khong co replication. Dung `standard` neu can HA

### 4.2 Lay thong tin ket noi
```bash
gcloud redis instances describe thongthaispace-redis-prod \
  --region=asia-southeast1 \
  --format="get(host,port)"
```
REDIS_URL se la: `redis://HOST:PORT`

> **Luu y:** Memorystore Basic tier KHONG ho tro AUTH (password) mac dinh. Neu can AUTH, dung Standard tier voi `--enable-auth-network`.

### 4.3 Luu REDIS_URL vao Secret Manager
```bash
echo -n "redis://REDIS_HOST:6379" | \
  gcloud secrets create REDIS_URL --data-file=-
```

---

## Section 5: Container Registry (Artifact Registry)

### 5.1 Tao Repository
```bash
gcloud artifacts repositories create thongthaispace \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="ThongThaiSpace Docker images"
```

### 5.2 Cau hinh Docker Authentication
```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

### 5.3 Build va Push Images
```bash
REGISTRY=asia-southeast1-docker.pkg.dev/thongthaispace-prod/thongthaispace

# Build backend
docker build -t $REGISTRY/backend:latest \
  -t $REGISTRY/backend:$(git rev-parse --short HEAD) \
  ./backend

# Build frontend (QUAN TRONG: truyen NEXT_PUBLIC_* luc build)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.thongthaispace.com/api \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.thongthaispace.com \
  -t $REGISTRY/frontend:latest \
  -t $REGISTRY/frontend:$(git rev-parse --short HEAD) \
  ./frontend

# Push
docker push $REGISTRY/backend:latest
docker push $REGISTRY/frontend:latest
```

> **QUAN TRONG - Can sua `frontend/Dockerfile`:**
> Next.js build inline `NEXT_PUBLIC_*` variables luc build. Can them vao builder stage:
> ```dockerfile
> ARG NEXT_PUBLIC_API_URL
> ARG NEXT_PUBLIC_SOCKET_URL
> ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
> ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
> RUN pnpm build
> ```

---

## Section 6: Backend Deployment (Cloud Run)

### 6.1 Luu tat ca Secrets vao Secret Manager
```bash
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)

echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "$JWT_REFRESH_SECRET" | gcloud secrets create JWT_REFRESH_SECRET --data-file=-
echo -n "your-anthropic-api-key" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-

# Optional secrets (chi khi dung features tuong ung)
echo -n "google-client-id" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "google-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
echo -n "resend-api-key" | gcloud secrets create RESEND_API_KEY --data-file=-
```

### 6.2 Deploy Backend Service
```bash
REGISTRY=asia-southeast1-docker.pkg.dev/thongthaispace-prod/thongthaispace

gcloud run deploy thongthaispace-backend \
  --image=$REGISTRY/backend:latest \
  --region=asia-southeast1 \
  --platform=managed \
  --port=4000 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=5 \
  --concurrency=80 \
  --timeout=300 \
  --vpc-connector=thongthaispace-connector \
  --vpc-egress=private-ranges-only \
  --set-env-vars="NODE_ENV=production,PORT=4000,STORAGE_PROVIDER=local,FRONTEND_URL=https://thongthaispace.com,GOOGLE_CALLBACK_URL=https://api.thongthaispace.com/api/auth/google/callback,JWT_EXPIRES_IN=15m,JWT_REFRESH_EXPIRES_IN=7d,VAPID_SUBJECT=mailto:hoangthai229@gmail.com" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,REDIS_URL=REDIS_URL:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
  --ingress=all \
  --allow-unauthenticated \
  --execution-environment=gen2 \
  --cpu-boost \
  --startup-cpu-boost \
  --session-affinity
```

**Ghi chu quan trong:**
- `--port=4000`: Khop voi EXPOSE 4000 trong backend Dockerfile
- `--min-instances=1`: Giu 1 instance luon chay. Dat 0 cho dev de tiet kiem
- `--session-affinity`: Quan trong cho WebSocket/Socket.IO connections
- `--vpc-connector`: Bat buoc de ket noi Cloud SQL (private IP) va Memorystore
- `--vpc-egress=private-ranges-only`: Chi route private IP qua VPC (re hon)
- `--cpu-boost / --startup-cpu-boost`: Giup cold start nhanh hon (migration chay luc start)
- `--execution-environment=gen2`: Can thiet cho WebSocket support tren Cloud Run

> **WebSocket tren Cloud Run:** Gen2 ho tro WebSocket native. Timeout mac dinh 300s. Cho WebSocket persistent, dat `--timeout=3600` (toi da 1h tren Cloud Run). Socket.IO se tu dong reconnect.

> **Concurrent migrations:** Voi nhieu instances scale up, co the co migration chay dong thoi. Prisma dung advisory locks nen an toan, nhung them 2-5s vao cold start.

### 6.3 Cau hinh Health Checks
```bash
gcloud run services update thongthaispace-backend \
  --region=asia-southeast1 \
  --liveness-probe-http-get-path=/api/health/live \
  --liveness-probe-initial-delay=10 \
  --liveness-probe-period=30 \
  --startup-probe-http-get-path=/api/health/ready \
  --startup-probe-initial-delay=5 \
  --startup-probe-period=10 \
  --startup-probe-failure-threshold=10
```

---

## Section 7: Frontend Deployment (Cloud Run)

### 7.1 Deploy Frontend Service
```bash
gcloud run deploy thongthaispace-frontend \
  --image=$REGISTRY/frontend:latest \
  --region=asia-southeast1 \
  --platform=managed \
  --port=3000 \
  --cpu=1 \
  --memory=256Mi \
  --min-instances=1 \
  --max-instances=5 \
  --concurrency=100 \
  --timeout=60 \
  --ingress=all \
  --allow-unauthenticated \
  --execution-environment=gen2
```
- `--memory=256Mi`: Next.js standalone server nhe
- Khong can VPC connector vi frontend khong truc tiep ket noi DB hay Redis
- `NEXT_PUBLIC_*` da duoc inline luc build, khong can luc runtime

### 7.2 Cau hinh Health Checks
```bash
gcloud run services update thongthaispace-frontend \
  --region=asia-southeast1 \
  --startup-probe-http-get-path=/api/health \
  --startup-probe-initial-delay=5 \
  --startup-probe-period=10 \
  --startup-probe-failure-threshold=5
```

---

## Section 8: Storage Setup (Cloud Storage)

### 8.1 Tao Storage Bucket
```bash
gsutil mb -l asia-southeast1 -c standard gs://thongthaispace-uploads-prod

# Dat CORS policy
cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["https://thongthaispace.com", "https://api.thongthaispace.com"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set /tmp/cors.json gs://thongthaispace-uploads-prod
```

### 8.2 Cau hinh S3-Compatible Access
Cloud Storage ho tro S3 XML API. Neu dung `STORAGE_PROVIDER=r2` (dung `@aws-sdk/client-s3`):
```bash
# Tao HMAC key cho S3-compatible access
gsutil hmac create $SA_EMAIL
```
Cau hinh env vars:
- `R2_ACCESS_KEY_ID` = HMAC access ID
- `R2_SECRET_ACCESS_KEY` = HMAC secret
- Endpoint: `https://storage.googleapis.com`
- `R2_BUCKET_NAME` = `thongthaispace-uploads-prod`

### 8.3 Public access (neu can)
```bash
gsutil iam ch allUsers:objectViewer gs://thongthaispace-uploads-prod
```

---

## Section 9: Load Balancer, SSL, va Domain Mapping

### 9.1 Option A: Cloud Run Custom Domain (Don gian)
```bash
# Map backend domain
gcloud run domain-mappings create \
  --service=thongthaispace-backend \
  --domain=api.thongthaispace.com \
  --region=asia-southeast1

# Map frontend domain
gcloud run domain-mappings create \
  --service=thongthaispace-frontend \
  --domain=thongthaispace.com \
  --region=asia-southeast1
```
> SSL certificate tu dong duoc cap boi Google. Day la cach don gian nhat.

### 9.2 Option B: Global External HTTPS Load Balancer (Nang cao - voi CDN + WAF)
Khuyen nghi cho production voi CDN va Cloud Armor.

```bash
# Tao serverless NEGs cho moi Cloud Run service
gcloud compute network-endpoint-groups create backend-neg \
  --region=asia-southeast1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=thongthaispace-backend

gcloud compute network-endpoint-groups create frontend-neg \
  --region=asia-southeast1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=thongthaispace-frontend

# Tao backend services
gcloud compute backend-services create backend-bs \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED
gcloud compute backend-services add-backend backend-bs \
  --global \
  --network-endpoint-group=backend-neg \
  --network-endpoint-group-region=asia-southeast1

gcloud compute backend-services create frontend-bs \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC
gcloud compute backend-services add-backend frontend-bs \
  --global \
  --network-endpoint-group=frontend-neg \
  --network-endpoint-group-region=asia-southeast1

# Tao URL map voi path-based routing
gcloud compute url-maps create thongthaispace-urlmap \
  --default-service=frontend-bs

gcloud compute url-maps add-path-matcher thongthaispace-urlmap \
  --path-matcher-name=api-matcher \
  --default-service=frontend-bs \
  --path-rules="/api/*=backend-bs,/socket.io/*=backend-bs,/uploads/*=backend-bs"

# Reserve static IP
gcloud compute addresses create thongthaispace-ip --global

# Tao SSL certificate
gcloud compute ssl-certificates create thongthaispace-cert \
  --domains=thongthaispace.com,api.thongthaispace.com \
  --global

# Tao HTTPS proxy
gcloud compute target-https-proxies create thongthaispace-https-proxy \
  --url-map=thongthaispace-urlmap \
  --ssl-certificates=thongthaispace-cert

# Tao forwarding rule
gcloud compute forwarding-rules create thongthaispace-https-forwarding \
  --global \
  --target-https-proxy=thongthaispace-https-proxy \
  --address=thongthaispace-ip \
  --ports=443

# HTTP-to-HTTPS redirect
gcloud compute url-maps create thongthaispace-http-redirect \
  --default-url-redirect-https-redirect

gcloud compute target-http-proxies create thongthaispace-http-proxy \
  --url-map=thongthaispace-http-redirect

gcloud compute forwarding-rules create thongthaispace-http-forwarding \
  --global \
  --target-http-proxy=thongthaispace-http-proxy \
  --address=thongthaispace-ip \
  --ports=80
```

> **WebSocket voi GCLB:** Ho tro native voi EXTERNAL_MANAGED scheme. Dat timeout cao cho WebSocket:
> ```bash
> gcloud compute backend-services update backend-bs --global --timeout=3600
> ```
> **CDN:** Chi bat cho `frontend-bs`. KHONG bat cho `backend-bs` vi API, WebSocket, uploads khong duoc cache.

### 9.3 Cloud Armor WAF (chi voi Option B)
```bash
gcloud compute security-policies create thongthaispace-waf \
  --description="ThongThaiSpace WAF policy"

# SQL Injection protection
gcloud compute security-policies rules create 1000 \
  --security-policy=thongthaispace-waf \
  --expression="evaluatePreconfiguredWaf('sqli-v33-stable')" \
  --action=deny-403

# XSS protection
gcloud compute security-policies rules create 1001 \
  --security-policy=thongthaispace-waf \
  --expression="evaluatePreconfiguredWaf('xss-v33-stable')" \
  --action=deny-403

# Rate limiting (bo sung cho app-level Throttler)
gcloud compute security-policies rules create 2000 \
  --security-policy=thongthaispace-waf \
  --expression="true" \
  --action=throttle \
  --rate-limit-threshold-count=300 \
  --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP

# Ap dung cho backend va frontend
gcloud compute backend-services update backend-bs --global --security-policy=thongthaispace-waf
gcloud compute backend-services update frontend-bs --global --security-policy=thongthaispace-waf
```

---

## Section 10: DNS Configuration

### 10.1 Cloud DNS
```bash
# Tao DNS zone
gcloud dns managed-zones create thongthaispace-zone \
  --dns-name=thongthaispace.com. \
  --description="ThongThaiSpace DNS zone"

# Neu dung Load Balancer (Option B):
LB_IP=$(gcloud compute addresses describe thongthaispace-ip --global --format="get(address)")

gcloud dns record-sets create thongthaispace.com. \
  --zone=thongthaispace-zone \
  --type=A --ttl=300 --rrdatas=$LB_IP

gcloud dns record-sets create api.thongthaispace.com. \
  --zone=thongthaispace-zone \
  --type=A --ttl=300 --rrdatas=$LB_IP
```

### 10.2 Cap nhat Domain Registrar
- [ ] Tro nameservers cua domain sang Google Cloud DNS nameservers
- [ ] Hoac them A records tai DNS provider hien tai tro vao LB IP

> **Luu y:** SSL certificate can DNS duoc tro dung. Mat 15-60 phut de provision sau khi DNS propagate.

---

## Section 11: Monitoring va Logging

### 11.1 Cloud Monitoring (Tu dong)
Cloud Run tu dong gui metrics: Request count, latency, error rates, instance count, CPU/memory utilization.

### 11.2 Tao Alerting Policies
Tao alerts tai Console: Monitoring > Alerting > Create Policy:
- [ ] Backend 5xx error rate > 5%
- [ ] Backend latency p99 > 5s
- [ ] Backend instance count dat max (5)
- [ ] Frontend 5xx error rate > 5%
- [ ] Cloud SQL CPU > 80% trong 5 phut
- [ ] Cloud SQL storage > 80%
- [ ] Cloud SQL connections > 80 (tren 100 max)
- [ ] Memorystore memory usage > 80%

### 11.3 Tao Notification Channel
```bash
gcloud monitoring channels create \
  --display-name="DevOps Email" \
  --type=email \
  --channel-labels=email_address=hoangthai229@gmail.com
```

### 11.4 Optional: Self-Hosted Monitoring Stack
Neu muon dung Prometheus/Grafana/Alertmanager tu `deploy/monitoring/`:
```bash
gcloud compute instances create monitoring-vm \
  --zone=asia-southeast1-a \
  --machine-type=e2-small \
  --network=thongthaispace-vpc \
  --subnet=thongthaispace-subnet \
  --boot-disk-size=30GB \
  --image-family=cos-stable \
  --image-project=cos-cloud
```
SSH vao va chay `docker-compose.monitoring.yml`. Them ~$15/thang nhung co dashboard va alerts san.

---

## Section 12: CI/CD Pipeline (GitHub Actions)

### 12.1 Workload Identity Federation (Khuyen nghi)
```bash
# Tao workload identity pool
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions Pool"

# Tao provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Cho phep GitHub repo gia danh service account
POOL_ID=$(gcloud iam workload-identity-pools describe github-pool --location=global --format="get(name)")

gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/YOUR_GITHUB_ORG/ThongThaiSpace"
```

### 12.2 GitHub Actions Workflow
Tao `.github/workflows/deploy-gcp.yml`:
```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  PROJECT_ID: thongthaispace-prod
  REGION: asia-southeast1
  REGISTRY: asia-southeast1-docker.pkg.dev/thongthaispace-prod/thongthaispace

jobs:
  ci:
    uses: ./.github/workflows/ci.yml

  deploy-backend:
    needs: ci
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: cicd-deployer@thongthaispace-prod.iam.gserviceaccount.com

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker asia-southeast1-docker.pkg.dev

      - name: Build and push backend
        run: |
          docker build -t $REGISTRY/backend:${{ github.sha }} -t $REGISTRY/backend:latest ./backend
          docker push $REGISTRY/backend:${{ github.sha }}
          docker push $REGISTRY/backend:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy thongthaispace-backend \
            --image=$REGISTRY/backend:${{ github.sha }} \
            --region=$REGION

  deploy-frontend:
    needs: ci
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: cicd-deployer@thongthaispace-prod.iam.gserviceaccount.com

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker asia-southeast1-docker.pkg.dev

      - name: Build and push frontend
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_URL=https://api.thongthaispace.com/api \
            --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.thongthaispace.com \
            -t $REGISTRY/frontend:${{ github.sha }} \
            -t $REGISTRY/frontend:latest \
            ./frontend
          docker push $REGISTRY/frontend:${{ github.sha }}
          docker push $REGISTRY/frontend:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy thongthaispace-frontend \
            --image=$REGISTRY/frontend:${{ github.sha }} \
            --region=$REGION

      - name: Health check
        run: |
          sleep 30
          curl -fsS https://api.thongthaispace.com/api/health/ready
          curl -fsS https://thongthaispace.com/api/health
```

---

## Section 13: Backup Strategy

### 13.1 Cloud SQL Automated Backups (Da cau hinh)
- Backup tu dong hang ngay (da bat o Section 3)
- Retention mac dinh 7 ngay, tang len 14:
  ```bash
  gcloud sql instances patch thongthaispace-db-prod \
    --backup-retention-count=14
  ```

### 13.2 Backup truoc khi deploy lon
```bash
gcloud sql backups create --instance=thongthaispace-db-prod \
  --description="Pre-deployment backup $(date +%Y%m%d)"
```

### 13.3 Export ra Cloud Storage (luu tru dai han)
```bash
gsutil mb -l asia-southeast1 gs://thongthaispace-db-backups

gcloud sql export sql thongthaispace-db-prod \
  gs://thongthaispace-db-backups/backup-$(date +%Y%m%d).sql.gz \
  --database=thongthai_space

# Lifecycle policy - xoa sau 90 ngay
cat > /tmp/lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [{"action": {"type": "Delete"}, "condition": {"age": 90}}]
  }
}
EOF
gsutil lifecycle set /tmp/lifecycle.json gs://thongthaispace-db-backups
```

---

## Section 14: Security Hardening

### 14.1 Network Security
- [ ] Cloud SQL KHONG co public IP (`--no-assign-ip`)
- [ ] Memorystore chi truy cap duoc tu VPC
- [ ] Cloud Run dung VPC connector voi `private-ranges-only` egress
- [ ] Cloud Armor WAF da bat (neu dung Load Balancer)

### 14.2 Secret Management
- [ ] Tat ca secrets luu trong Secret Manager, khong phai environment variables
- [ ] Service accounts dung nguyen tac least privilege
- [ ] Khong co JSON key files trong repo
- [ ] Rotate JWT secrets moi 90 ngay

### 14.3 Application-Level Security (Da co trong codebase)
- Helmet middleware (security headers)
- CORS scoped to FRONTEND_URL
- Rate limiting: 100 req/60s (Redis-backed Throttler)
- JWT HttpOnly cookies (khong dung localStorage)
- Cookie domain: `.thongthaispace.com`
- bcryptjs password hashing
- Input validation qua class-validator

### 14.4 IAM Audit
- [ ] Bat Cloud Audit Logs
- [ ] Review IAM bindings hang quy
- [ ] Bat organization policy constraints neu dung GCP organization

---

## Section 15: Development Environment

### 15.1 Tao Dev Resources (Specs thap hon, chi phi thap)
```bash
gcloud config set project thongthaispace-dev

# Dev Cloud SQL - tier nho nhat
gcloud sql instances create thongthaispace-db-dev \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-type=HDD \
  --storage-size=10GB \
  --no-backup \
  --availability-type=zonal

# Dev Redis
gcloud redis instances create thongthaispace-redis-dev \
  --size=1 \
  --region=asia-southeast1 \
  --network=default \
  --redis-version=redis_7_2 \
  --tier=basic

# Dev Cloud Run - min-instances=0 (scale to zero de tiet kiem)
gcloud run deploy thongthaispace-backend-dev \
  --image=$REGISTRY/backend:develop \
  --region=asia-southeast1 \
  --port=4000 \
  --cpu=1 --memory=512Mi \
  --min-instances=0 --max-instances=2 \
  --set-env-vars="NODE_ENV=production,FRONTEND_URL=https://dev.thongthaispace.com"
  # ... (cau hinh secrets tuong tu cho dev)

gcloud run deploy thongthaispace-frontend-dev \
  --image=$REGISTRY/frontend:develop \
  --region=asia-southeast1 \
  --port=3000 \
  --cpu=1 --memory=256Mi \
  --min-instances=0 --max-instances=2
```

### 15.2 Dev CI/CD
- Deploy tu branch `develop` tu dong
- Dung cung GitHub Actions workflow voi project/service targets khac

---

## Section 16: Uoc tinh Chi phi (GCP)

### Production (Hang thang)
| Dich vu | Cau hinh | Uoc tinh |
|---------|----------|----------|
| Cloud Run Backend | 1 vCPU, 512Mi, min=1, avg 2 instances | ~$30-50 |
| Cloud Run Frontend | 1 vCPU, 256Mi, min=1, avg 2 instances | ~$20-35 |
| Cloud SQL PostgreSQL 16 | db-custom-1-3840, 20GB SSD | ~$50-70 |
| Memorystore Redis | 1GB Basic | ~$35 |
| Cloud Storage | 10GB + requests | ~$1-3 |
| Cloud Load Balancer | HTTPS LB + forwarding rules | ~$18-25 |
| Cloud DNS | 1 zone + queries | ~$1 |
| Cloud Armor | Base policy + rules | ~$5-10 |
| Artifact Registry | Image storage | ~$1-3 |
| Secret Manager | 10 secrets | ~$0.06 |
| Cloud Monitoring | Free tier | ~$0 |
| **TONG PRODUCTION** | | **~$160-230/thang** |

### Development (Hang thang)
| Dich vu | Cau hinh | Uoc tinh |
|---------|----------|----------|
| Cloud Run Backend | min=0, scale to zero | ~$5-15 |
| Cloud Run Frontend | min=0, scale to zero | ~$3-10 |
| Cloud SQL PostgreSQL | db-f1-micro, 10GB HDD | ~$10-15 |
| Memorystore Redis | 1GB Basic | ~$35 |
| VPC Connector | f1-micro x2 | ~$7 |
| **TONG DEVELOPMENT** | | **~$60-80/thang** |

**Meo tiet kiem:**
- Committed use discounts cho Cloud SQL (1 nam: -25%, 3 nam: -52%)
- Dev Memorystore la chi phi dev lon nhat - co the chay Redis tren Cloud Run container (~$5 thay vi $35)
- Dat budget alerts o 80% chi phi du kien

---

## Section 17: Kiem tra End-to-End

```bash
# 1. Backend health (liveness)
curl -v https://api.thongthaispace.com/api/health/live
# Ky vong: 200 OK

# 2. Backend health (readiness - kiem tra DB + Redis)
curl -v https://api.thongthaispace.com/api/health/ready
# Ky vong: 200 OK voi DB va Redis status

# 3. Frontend health
curl -v https://thongthaispace.com/api/health
# Ky vong: 200 OK

# 4. Frontend loads
curl -v https://thongthaispace.com/
# Ky vong: 200 OK, noi dung HTML

# 5. API responds
curl -v https://api.thongthaispace.com/api/
# Ky vong: Valid API response

# 6. WebSocket connection
npx wscat -c "wss://api.thongthaispace.com/socket.io/?EIO=4&transport=websocket"
# Ky vong: Ket noi thanh cong

# 7. SSL certificate hop le
openssl s_client -connect thongthaispace.com:443 -servername thongthaispace.com \
  < /dev/null 2>/dev/null | openssl x509 -noout -dates
# Ky vong: Certificate dates hop le

# 8. CORS hoat dong
curl -v -H "Origin: https://thongthaispace.com" \
  https://api.thongthaispace.com/api/health/live
# Ky vong: Access-Control-Allow-Origin: https://thongthaispace.com

# 9. HTTP redirect sang HTTPS
curl -v http://thongthaispace.com/
# Ky vong: 301 redirect sang https://

# 10. Database migrations da apply
gcloud run services logs read thongthaispace-backend --region=asia-southeast1 --limit=50
# Ky vong: "[entrypoint] Running Prisma migrations" va thanh cong

# 11. Rate limiting hoat dong
for i in $(seq 1 105); do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.thongthaispace.com/api/health/live
done
# Ky vong: 429 sau ~100 requests

# 12. Cloud SQL connectivity
gcloud sql connect thongthaispace-db-prod --user=thongthai --database=thongthai_space
# Chay: SELECT count(*) FROM "_prisma_migrations";
# Ky vong: 10 migrations da apply
```

---

## Cac file can chinh sua truoc khi deploy

| File | Thay doi |
|------|----------|
| `frontend/Dockerfile` | Them `ARG NEXT_PUBLIC_API_URL`, `ARG NEXT_PUBLIC_SOCKET_URL`, `ENV` tuong ung vao builder stage |
| `.github/workflows/deploy-gcp.yml` | Tao moi (xem Section 12) |

---

> **Tao boi:** Claude Opus 4.6 - Kiem tra toan bo codebase ThongThaiSpace
> **Ngay tao:** 2026-04-01
