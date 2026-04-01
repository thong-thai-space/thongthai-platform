# ThongThaiSpace - Amazon Web Services (AWS) Deployment Checklist

> Checklist chi tiet tung buoc deploy ThongThaiSpace len AWS cho ca Production va Development.
> Region khuyen nghi: `ap-southeast-1` (Singapore - gan Viet Nam nhat).

---

## Thong tin ky thuat tu codebase

| Thanh phan | Chi tiet |
|---|---|
| **Backend** | NestJS 11, port 4000, Docker multi-stage (node:20-alpine) |
| **Frontend** | Next.js 15 standalone, port 3000, Docker multi-stage (node:20-alpine) |
| **Database** | PostgreSQL 16 (Prisma 7 ORM, 14 models, 10 migrations) |
| **Cache** | Redis 7 (Keyv caching, Throttler rate-limit, Socket.IO adapter) |
| **WebSocket** | Socket.IO v4 voi Redis adapter (can WebSocket upgrade tai LB) |
| **File Storage** | Local `/uploads` hoac S3-compatible (Cloudflare R2 / AWS S3) |
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

### 1.1 AWS Account va Billing
- [ ] Tao tai khoan AWS tai https://aws.amazon.com
- [ ] Bat MFA cho IAM root user (bat buoc)
- [ ] Tao IAM admin user (khong bao gio dung root cho cong viec hang ngay)
  ```bash
  aws iam create-user --user-name thongthai-admin
  aws iam attach-user-policy --user-name thongthai-admin \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
  ```
- [ ] Dat billing alerts tai $50, $100, $200
  - Console: Billing > Budgets > Create budget
- [ ] Luu y: Free Tier bao gom 12 thang cac dich vu nhat dinh

### 1.2 Cai dat CLI Tools
```bash
# Cai AWS CLI v2
# https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
aws --version

# Cau hinh credentials
aws configure
# Region: ap-southeast-1 (Singapore)
# Output format: json
```
- [ ] Cai Docker Desktop
- [ ] Cai `psql` client
- [ ] Cai `redis-cli`

### 1.3 OIDC Provider cho GitHub Actions (Khuyen nghi - keyless auth)
```bash
# Tao OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Tao trust policy
cat > /tmp/trust-policy.json << 'TRUST'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/ThongThaiSpace:*"
        }
      }
    }
  ]
}
TRUST

aws iam create-role --role-name GitHubActionsDeployer \
  --assume-role-policy-document file:///tmp/trust-policy.json
```

### 1.4 IAM Policy cho CI/CD
```bash
cat > /tmp/cicd-policy.json << 'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "iam:PassRole"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-southeast-1:*:secret:thongthaispace/*"
    }
  ]
}
POLICY

aws iam create-policy --policy-name ThongThaiSpaceCICDPolicy \
  --policy-document file:///tmp/cicd-policy.json

aws iam attach-role-policy --role-name GitHubActionsDeployer \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/ThongThaiSpaceCICDPolicy
```

---

## Section 2: Networking Setup (VPC)

### 2.1 Tao VPC
```bash
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=thongthaispace-vpc}]' \
  --query 'Vpc.VpcId' --output text)

# Bat DNS hostnames (bat buoc cho RDS)
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
```

### 2.2 Tao Subnets
```bash
# Public subnets (cho ALB)
PUB_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-southeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=thongthaispace-public-1a}]' \
  --query 'Subnet.SubnetId' --output text)

PUB_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ap-southeast-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=thongthaispace-public-1b}]' \
  --query 'Subnet.SubnetId' --output text)

# Private subnets (cho ECS tasks, RDS, ElastiCache)
PRIV_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.10.0/24 \
  --availability-zone ap-southeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=thongthaispace-private-1a}]' \
  --query 'Subnet.SubnetId' --output text)

PRIV_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone ap-southeast-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=thongthaispace-private-1b}]' \
  --query 'Subnet.SubnetId' --output text)
```

### 2.3 Internet Gateway va NAT Gateway
```bash
# Internet Gateway (cho public subnets / ALB)
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=thongthaispace-igw}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Elastic IP cho NAT Gateway
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
  --query 'AllocationId' --output text)

# NAT Gateway (cho private subnets truy cap internet)
NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB_SUBNET_1 \
  --allocation-id $EIP_ALLOC \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=thongthaispace-nat}]' \
  --query 'NatGateway.NatGatewayId' --output text)

aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID
```

> **Tai sao can NAT Gateway:** ECS Fargate tasks trong private subnets can internet de: pull Docker images tu ECR, goi Anthropic API, gui email qua Resend, Google OAuth callbacks.
> **Luu y chi phi:** NAT Gateway ~$32/thang (co dinh) + data processing charges. Day la chi phi co dinh cao nhat trong AWS setup.

### 2.4 Route Tables
```bash
# Public route table
PUB_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=thongthaispace-public-rt}]' \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PUB_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_SUBNET_1
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_SUBNET_2

# Private route table (qua NAT)
PRIV_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=thongthaispace-private-rt}]' \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PRIV_RT --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $PRIV_SUBNET_1
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $PRIV_SUBNET_2
```

### 2.5 Security Groups
```bash
# ALB Security Group
ALB_SG=$(aws ec2 create-security-group --group-name thongthaispace-alb-sg \
  --description "ALB Security Group" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0

# ECS Tasks Security Group
ECS_SG=$(aws ec2 create-security-group --group-name thongthaispace-ecs-sg \
  --description "ECS Tasks Security Group" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 4000 --source-group $ALB_SG
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 3000 --source-group $ALB_SG

# RDS Security Group
RDS_SG=$(aws ec2 create-security-group --group-name thongthaispace-rds-sg \
  --description "RDS Security Group" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $ECS_SG

# ElastiCache Security Group
REDIS_SG=$(aws ec2 create-security-group --group-name thongthaispace-redis-sg \
  --description "ElastiCache Security Group" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $REDIS_SG --protocol tcp --port 6379 --source-group $ECS_SG
```

> **Tai sao tach security groups:** Nguyen tac least privilege. Database chi truy cap duoc tu app containers, khong bao gio tu internet hay ALB.

---

## Section 3: Database Setup (RDS for PostgreSQL 16)

### 3.1 Tao RDS Subnet Group
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name thongthaispace-db-subnets \
  --db-subnet-group-description "Private subnets for RDS" \
  --subnet-ids $PRIV_SUBNET_1 $PRIV_SUBNET_2
```

### 3.2 Tao RDS Instance (Production)
```bash
DB_PASSWORD=$(openssl rand -base64 32)
echo "Luu mat khau nay: $DB_PASSWORD"

aws rds create-db-instance \
  --db-instance-identifier thongthaispace-db-prod \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.4 \
  --master-username thongthai \
  --master-user-password "$DB_PASSWORD" \
  --db-name thongthai_space \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name thongthaispace-db-subnets \
  --no-publicly-accessible \
  --backup-retention-period 14 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:05:00-sun:06:00" \
  --deletion-protection \
  --copy-tags-to-snapshot \
  --monitoring-interval 60 \
  --monitoring-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-monitoring-role \
  --tags Key=Environment,Value=production Key=Project,Value=thongthaispace
```

**Giai thich cau hinh:**
- `db.t4g.micro`: 2 vCPU, 1 GB RAM, ARM-based (re nhat cho small workloads)
- `gp3`: Storage the he moi, 3000 IOPS baseline
- `--storage-encrypted`: Ma hoa khi luu tru
- `--backup-retention-period 14`: Khop voi 14-ngay retention tu `deploy/backup/.env.backup.example`
- `--no-publicly-accessible`: Database chi truy cap duoc trong VPC

> **Luu y:** Tao RDS mat 10-15 phut. Doi:
> ```bash
> aws rds wait db-instance-available --db-instance-identifier thongthaispace-db-prod
> ```

### 3.3 Tao Enhanced Monitoring Role
```bash
aws iam create-role --role-name rds-monitoring-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "monitoring.rds.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
aws iam attach-role-policy --role-name rds-monitoring-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
```

### 3.4 Lay Endpoint
```bash
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier thongthaispace-db-prod \
  --query 'DBInstances[0].Endpoint.Address' --output text)
echo "DATABASE_URL=postgresql://thongthai:PASSWORD@${RDS_ENDPOINT}:5432/thongthai_space?schema=public"
```

### 3.5 Chay Migration lan dau
Dung bastion hoac SSH tunnel:
```bash
# SSH tunnel qua bastion (neu tao):
ssh -L 5432:$RDS_ENDPOINT:5432 ec2-user@bastion-ip

# Tu local, trong thu muc backend/:
DATABASE_URL="postgresql://thongthai:PASSWORD@127.0.0.1:5432/thongthai_space?schema=public" \
  npx prisma migrate deploy
```

---

## Section 4: Cache Setup (ElastiCache for Redis 7)

### 4.1 Tao ElastiCache Subnet Group
```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name thongthaispace-redis-subnets \
  --cache-subnet-group-description "Private subnets for Redis" \
  --subnet-ids $PRIV_SUBNET_1 $PRIV_SUBNET_2
```

### 4.2 Tao ElastiCache Redis Cluster (Production)
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id thongthaispace-redis-prod \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.1 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name thongthaispace-redis-subnets \
  --security-group-ids $REDIS_SG \
  --snapshot-retention-limit 3 \
  --preferred-maintenance-window sun:05:00-sun:06:00 \
  --tags Key=Environment,Value=production Key=Project,Value=thongthaispace
```
- `cache.t4g.micro`: 0.5 GB, ARM-based. Du cho caching, rate limiting, Socket.IO adapter
- `--num-cache-nodes 1`: Single node cho tiet kiem. Dung replication group cho HA

### 4.3 Lay Endpoint
```bash
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id thongthaispace-redis-prod \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)
echo "REDIS_URL=redis://${REDIS_ENDPOINT}:6379"
```

---

## Section 5: Container Registry (ECR)

### 5.1 Tao Repositories
```bash
aws ecr create-repository --repository-name thongthaispace/backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

aws ecr create-repository --repository-name thongthaispace/frontend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

### 5.2 Lifecycle Policy (Giu 10 images cuoi)
```bash
LIFECYCLE_POLICY='{
  "rules": [{
    "rulePriority": 1,
    "description": "Keep last 10 images",
    "selection": {
      "tagStatus": "any",
      "countType": "imageCountMoreThan",
      "countNumber": 10
    },
    "action": {"type": "expire"}
  }]
}'

aws ecr put-lifecycle-policy --repository-name thongthaispace/backend \
  --lifecycle-policy-text "$LIFECYCLE_POLICY"
aws ecr put-lifecycle-policy --repository-name thongthaispace/frontend \
  --lifecycle-policy-text "$LIFECYCLE_POLICY"
```

### 5.3 Build va Push Images
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY=$ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# Login vao ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin $REGISTRY

# Build va push backend
docker build -t $REGISTRY/thongthaispace/backend:latest ./backend
docker push $REGISTRY/thongthaispace/backend:latest

# Build va push frontend (voi build-time env vars)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.thongthaispace.com/api \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.thongthaispace.com \
  -t $REGISTRY/thongthaispace/frontend:latest ./frontend
docker push $REGISTRY/thongthaispace/frontend:latest
```

> **QUAN TRONG - Can sua `frontend/Dockerfile`:**
> Them vao builder stage:
> ```dockerfile
> ARG NEXT_PUBLIC_API_URL
> ARG NEXT_PUBLIC_SOCKET_URL
> ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
> ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
> RUN pnpm build
> ```

---

## Section 6: Backend Deployment (ECS Fargate)

### 6.1 Luu Secrets vao AWS Secrets Manager
```bash
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)

aws secretsmanager create-secret --name thongthaispace/DATABASE_URL \
  --secret-string "postgresql://thongthai:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/thongthai_space?schema=public"

aws secretsmanager create-secret --name thongthaispace/JWT_SECRET \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret --name thongthaispace/JWT_REFRESH_SECRET \
  --secret-string "$JWT_REFRESH_SECRET"

aws secretsmanager create-secret --name thongthaispace/REDIS_URL \
  --secret-string "redis://${REDIS_ENDPOINT}:6379"

aws secretsmanager create-secret --name thongthaispace/ANTHROPIC_API_KEY \
  --secret-string "your-anthropic-api-key"

# Optional
aws secretsmanager create-secret --name thongthaispace/GOOGLE_CLIENT_ID \
  --secret-string "your-google-client-id"
aws secretsmanager create-secret --name thongthaispace/GOOGLE_CLIENT_SECRET \
  --secret-string "your-google-client-secret"
```

### 6.2 Tao ECS Cluster
```bash
aws ecs create-cluster --cluster-name thongthaispace-prod \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1,base=1 \
    capacityProvider=FARGATE_SPOT,weight=3 \
  --configuration executeCommandConfiguration={logging=DEFAULT} \
  --settings name=containerInsights,value=enabled
```
> **FARGATE_SPOT:** Tiet kiem toi 70% compute costs. `base=1` dam bao it nhat 1 task chay tren regular Fargate (on dinh). Them tasks co the dung Spot (re hon nhung co the bi gian doan).

### 6.3 Tao IAM Roles

**Task Execution Role** (de ECS pull images va doc secrets):
```bash
aws iam create-role --role-name thongthaispace-ecs-execution \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name thongthaispace-ecs-execution \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Them Secrets Manager access
cat > /tmp/secrets-policy.json << 'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:ap-southeast-1:*:secret:thongthaispace/*"
  }]
}
POLICY
aws iam put-role-policy --role-name thongthaispace-ecs-execution \
  --policy-name SecretsAccess \
  --policy-document file:///tmp/secrets-policy.json
```

**Task Role** (cho application):
```bash
aws iam create-role --role-name thongthaispace-ecs-task \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# S3 access cho uploads
aws iam put-role-policy --role-name thongthaispace-ecs-task \
  --policy-name S3UploadsAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject","s3:GetObject","s3:DeleteObject"],
      "Resource": "arn:aws:s3:::thongthaispace-uploads-prod/*"
    }]
  }'
```

### 6.4 Tao CloudWatch Log Groups
```bash
aws logs create-log-group --log-group-name /ecs/thongthaispace-backend
aws logs create-log-group --log-group-name /ecs/thongthaispace-frontend
aws logs put-retention-policy --log-group-name /ecs/thongthaispace-backend --retention-in-days 30
aws logs put-retention-policy --log-group-name /ecs/thongthaispace-frontend --retention-in-days 30
```

### 6.5 Dang ky Backend Task Definition
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

cat > /tmp/backend-task.json << TASK
{
  "family": "thongthaispace-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/thongthaispace-ecs-execution",
  "taskRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/thongthaispace-ecs-task",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/thongthaispace/backend:latest",
      "essential": true,
      "portMappings": [{"containerPort": 4000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "4000"},
        {"name": "STORAGE_PROVIDER", "value": "local"},
        {"name": "FRONTEND_URL", "value": "https://thongthaispace.com"},
        {"name": "GOOGLE_CALLBACK_URL", "value": "https://api.thongthaispace.com/api/auth/google/callback"},
        {"name": "JWT_EXPIRES_IN", "value": "15m"},
        {"name": "JWT_REFRESH_EXPIRES_IN", "value": "7d"},
        {"name": "VAPID_SUBJECT", "value": "mailto:hoangthai229@gmail.com"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:${ACCOUNT_ID}:secret:thongthaispace/DATABASE_URL"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:${ACCOUNT_ID}:secret:thongthaispace/JWT_SECRET"},
        {"name": "JWT_REFRESH_SECRET", "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:${ACCOUNT_ID}:secret:thongthaispace/JWT_REFRESH_SECRET"},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:${ACCOUNT_ID}:secret:thongthaispace/REDIS_URL"},
        {"name": "ANTHROPIC_API_KEY", "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:${ACCOUNT_ID}:secret:thongthaispace/ANTHROPIC_API_KEY"}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:4000/api/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""],
        "interval": 15,
        "timeout": 5,
        "retries": 10,
        "startPeriod": 30
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/thongthaispace-backend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
TASK

aws ecs register-task-definition --cli-input-json file:///tmp/backend-task.json
```

**Ghi chu cau hinh:**
- `cpu: 512` (0.5 vCPU), `memory: 1024` (1 GB): Du cho NestJS + Prisma
- Health check khop voi docker-compose.prod.yml
- Secrets duoc ECS inject tu Secrets Manager lam env vars
- `startPeriod: 30`: Cho 30s de Prisma migrations chay truoc khi health check

### 6.6 Tao Backend ECS Service
> **Luu y:** Can tao ALB va target groups truoc (Section 9). Thu tu: ALB -> Target Groups -> ECS Services.

```bash
aws ecs create-service \
  --cluster thongthaispace-prod \
  --service-name thongthaispace-backend \
  --task-definition thongthaispace-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIV_SUBNET_1,$PRIV_SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$BACKEND_TG_ARN,containerName=backend,containerPort=4000" \
  --health-check-grace-period-seconds 60 \
  --enable-execute-command \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}"
```

> **`--enable-execute-command`:** Cho phep `aws ecs execute-command` SSH vao container dang chay. Rat huu ich de debug migration.
> **Concurrent migrations:** Voi `desired-count: 2`, ca 2 tasks chay `prisma migrate deploy` dong thoi. Prisma dung advisory locking nen an toan.

### 6.7 Auto-Scaling
```bash
# Dang ky scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/thongthaispace-prod/thongthaispace-backend \
  --min-capacity 2 \
  --max-capacity 6

# Scale theo CPU utilization
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/thongthaispace-prod/thongthaispace-backend \
  --policy-name backend-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## Section 7: Frontend Deployment (ECS Fargate)

### 7.1 Dang ky Frontend Task Definition
```bash
cat > /tmp/frontend-task.json << TASK
{
  "family": "thongthaispace-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/thongthaispace-ecs-execution",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/thongthaispace/frontend:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""],
        "interval": 15,
        "timeout": 5,
        "retries": 10,
        "startPeriod": 20
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/thongthaispace-frontend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
TASK

aws ecs register-task-definition --cli-input-json file:///tmp/frontend-task.json
```
- `cpu: 256` (0.25 vCPU), `memory: 512` (0.5 GB). Next.js standalone server rat nhe.

### 7.2 Tao Frontend ECS Service
```bash
aws ecs create-service \
  --cluster thongthaispace-prod \
  --service-name thongthaispace-frontend \
  --task-definition thongthaispace-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIV_SUBNET_1,$PRIV_SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$FRONTEND_TG_ARN,containerName=frontend,containerPort=3000" \
  --health-check-grace-period-seconds 30 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}"
```

---

## Section 8: Storage Setup (S3)

### 8.1 Tao S3 Bucket
```bash
aws s3api create-bucket \
  --bucket thongthaispace-uploads-prod \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

# Chan public access (phuc vu qua CloudFront hoac signed URLs)
aws s3api put-public-access-block \
  --bucket thongthaispace-uploads-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 8.2 Cau hinh CORS
```bash
aws s3api put-bucket-cors --bucket thongthaispace-uploads-prod \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["https://thongthaispace.com", "https://api.thongthaispace.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

### 8.3 Bat Versioning va Lifecycle
```bash
aws s3api put-bucket-versioning --bucket thongthaispace-uploads-prod \
  --versioning-configuration Status=Enabled

# Chuyen versions cu sang storage re hon sau 30 ngay, xoa sau 90 ngay
aws s3api put-bucket-lifecycle-configuration --bucket thongthaispace-uploads-prod \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "cleanup-old-versions",
      "Status": "Enabled",
      "NoncurrentVersionTransition": {
        "NoncurrentDays": 30,
        "StorageClass": "STANDARD_IA"
      },
      "NoncurrentVersionExpiration": {"NoncurrentDays": 90},
      "Filter": {"Prefix": ""}
    }]
  }'
```

> **Luu y:** Codebase dung `@aws-sdk/client-s3` voi `STORAGE_PROVIDER=r2`. Tren AWS, ECS tasks da co IAM task role voi S3 permissions -> AWS SDK tu dong dung task role credentials. Khong can access keys.

---

## Section 9: Load Balancer va SSL

### 9.1 Tao SSL Certificate (ACM)
```bash
CERT_ARN=$(aws acm request-certificate \
  --domain-name thongthaispace.com \
  --subject-alternative-names "*.thongthaispace.com" \
  --validation-method DNS \
  --query 'CertificateArn' --output text)

echo "Certificate ARN: $CERT_ARN"

# Lay DNS validation records
aws acm describe-certificate --certificate-arn $CERT_ARN \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'
```
Them CNAME records vao DNS de xac thuc. Doi certificate:
```bash
aws acm wait certificate-validated --certificate-arn $CERT_ARN
```

### 9.2 Tao Application Load Balancer
```bash
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name thongthaispace-alb \
  --subnets $PUB_SUBNET_1 $PUB_SUBNET_2 \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' --output text)
echo "ALB DNS: $ALB_DNS"
```

### 9.3 Tao Target Groups
```bash
# Backend target group
BACKEND_TG_ARN=$(aws elbv2 create-target-group \
  --name thongthaispace-backend-tg \
  --protocol HTTP --port 4000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/health/ready \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 5 \
  --matcher HttpCode=200 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Bat stickiness cho WebSocket (Socket.IO)
aws elbv2 modify-target-group-attributes \
  --target-group-arn $BACKEND_TG_ARN \
  --attributes \
    Key=stickiness.enabled,Value=true \
    Key=stickiness.type,Value=lb_cookie \
    Key=stickiness.lb_cookie.duration_seconds,Value=86400 \
    Key=deregistration_delay.timeout_seconds,Value=30

# Frontend target group
FRONTEND_TG_ARN=$(aws elbv2 create-target-group \
  --name thongthaispace-frontend-tg \
  --protocol HTTP --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
```

> **Stickiness cho Socket.IO:** Socket.IO dung HTTP long-polling truoc khi switch sang WebSocket. ALB phai route tat ca requests tu cung client sang cung backend task. Redis adapter (`@socket.io/redis-adapter`) xu ly cross-instance broadcasting, nhung pha HTTP polling can stickiness.

### 9.4 Tao Listeners
```bash
# HTTPS listener (port 443) - mac dinh tro ve frontend
HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG_ARN \
  --query 'Listeners[0].ListenerArn' --output text)

# HTTP listener (port 80) - redirect sang HTTPS
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP --port 80 \
  --default-actions '[{
    "Type": "redirect",
    "RedirectConfig": {
      "Protocol": "HTTPS",
      "Port": "443",
      "StatusCode": "HTTP_301"
    }
  }]'
```

### 9.5 Path-Based Routing Rules
```bash
# Route /api/* sang backend
aws elbv2 create-rule \
  --listener-arn $HTTPS_LISTENER_ARN \
  --priority 10 \
  --conditions '[{"Field":"path-pattern","Values":["/api/*"]}]' \
  --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"$BACKEND_TG_ARN\"}]"

# Route /socket.io/* sang backend
aws elbv2 create-rule \
  --listener-arn $HTTPS_LISTENER_ARN \
  --priority 20 \
  --conditions '[{"Field":"path-pattern","Values":["/socket.io/*"]}]' \
  --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"$BACKEND_TG_ARN\"}]"

# Route /uploads/* sang backend
aws elbv2 create-rule \
  --listener-arn $HTTPS_LISTENER_ARN \
  --priority 30 \
  --conditions '[{"Field":"path-pattern","Values":["/uploads/*"]}]' \
  --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"$BACKEND_TG_ARN\"}]"
```

> **Routing nay khop voi nginx config** trong `deploy/nginx/templates/site.conf.template`: `/api/*`, `/socket.io/*`, `/uploads/*` -> backend; con lai -> frontend.

### 9.6 WebSocket va Idle Timeout
ALB ho tro WebSocket native. Dat idle timeout cho long-lived connections:
```bash
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn $ALB_ARN \
  --attributes Key=idle_timeout.timeout_seconds,Value=3600
```

---

## Section 10: DNS Configuration (Route 53)

### 10.1 Tao Hosted Zone
```bash
ZONE_ID=$(aws route53 create-hosted-zone \
  --name thongthaispace.com \
  --caller-reference $(date +%s) \
  --query 'HostedZone.Id' --output text)
```

### 10.2 Tao DNS Records
```bash
# Ca 2 A records tro ve ALB (alias)
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "thongthaispace.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z1LMS91P8CMLE5",
            "DNSName": "'$ALB_DNS'",
            "EvaluateTargetHealth": true
          }
        }
      },
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.thongthaispace.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z1LMS91P8CMLE5",
            "DNSName": "'$ALB_DNS'",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
```

> **Luu y:** `Z1LMS91P8CMLE5` la ALB Hosted Zone ID cho ap-southeast-1. Day la gia tri co dinh theo region.

### 10.3 Cap nhat Domain Registrar
```bash
aws route53 get-hosted-zone --id $ZONE_ID --query 'DelegationSet.NameServers'
```
Tro nameservers cua domain sang Route 53 NS records.

---

## Section 11: Monitoring va Logging

### 11.1 CloudWatch Container Insights (Da bat)
ECS cluster tao voi `containerInsights=enabled` cung cap: CPU/Memory utilization, Network I/O, Storage I/O.

### 11.2 Tao SNS Topic cho Alerts
```bash
aws sns create-topic --name thongthaispace-alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-1:$ACCOUNT_ID:thongthaispace-alerts \
  --protocol email \
  --notification-endpoint hoangthai229@gmail.com
```

### 11.3 Tao CloudWatch Alarms
```bash
# Backend high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name thongthaispace-backend-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average --period 300 --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ClusterName,Value=thongthaispace-prod Name=ServiceName,Value=thongthaispace-backend \
  --alarm-actions arn:aws:sns:ap-southeast-1:$ACCOUNT_ID:thongthaispace-alerts

# RDS high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name thongthaispace-rds-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average --period 300 --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=thongthaispace-db-prod \
  --alarm-actions arn:aws:sns:ap-southeast-1:$ACCOUNT_ID:thongthaispace-alerts

# RDS free storage < 5GB
aws cloudwatch put-metric-alarm \
  --alarm-name thongthaispace-rds-low-storage \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average --period 300 --threshold 5368709120 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DBInstanceIdentifier,Value=thongthaispace-db-prod \
  --alarm-actions arn:aws:sns:ap-southeast-1:$ACCOUNT_ID:thongthaispace-alerts

# Redis high memory
aws cloudwatch put-metric-alarm \
  --alarm-name thongthaispace-redis-high-memory \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average --period 300 --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=CacheClusterId,Value=thongthaispace-redis-prod \
  --alarm-actions arn:aws:sns:ap-southeast-1:$ACCOUNT_ID:thongthaispace-alerts

# ALB 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name thongthaispace-alb-5xx \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum --period 60 --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 3 \
  --dimensions Name=LoadBalancer,Value=ALB_FULL_NAME \
  --alarm-actions arn:aws:sns:ap-southeast-1:$ACCOUNT_ID:thongthaispace-alerts \
  --treat-missing-data notBreaching
```

### 11.4 CloudWatch Log Metric Filters
```bash
aws logs put-metric-filter \
  --log-group-name /ecs/thongthaispace-backend \
  --filter-name AppErrors \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=BackendErrorCount,metricNamespace=ThongThaiSpace,metricValue=1
```

---

## Section 12: CI/CD Pipeline (GitHub Actions)

### 12.1 GitHub Actions Workflow
Tao `.github/workflows/deploy-aws.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: ap-southeast-1
  ECS_CLUSTER: thongthaispace-prod

jobs:
  ci:
    uses: ./.github/workflows/ci.yml

  deploy-backend:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployer
          aws-region: ${{ env.AWS_REGION }}

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Build and push backend
        env:
          REGISTRY: ${{ steps.ecr.outputs.registry }}
        run: |
          docker build -t $REGISTRY/thongthaispace/backend:${{ github.sha }} \
            -t $REGISTRY/thongthaispace/backend:latest ./backend
          docker push $REGISTRY/thongthaispace/backend:${{ github.sha }}
          docker push $REGISTRY/thongthaispace/backend:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service thongthaispace-backend \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services thongthaispace-backend

  deploy-frontend:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployer
          aws-region: ${{ env.AWS_REGION }}

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Build and push frontend
        env:
          REGISTRY: ${{ steps.ecr.outputs.registry }}
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_URL=https://api.thongthaispace.com/api \
            --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.thongthaispace.com \
            -t $REGISTRY/thongthaispace/frontend:${{ github.sha }} \
            -t $REGISTRY/thongthaispace/frontend:latest ./frontend
          docker push $REGISTRY/thongthaispace/frontend:${{ github.sha }}
          docker push $REGISTRY/thongthaispace/frontend:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service thongthaispace-frontend \
            --force-new-deployment

      - name: Wait and verify
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services thongthaispace-frontend
          sleep 15
          curl -fsS https://api.thongthaispace.com/api/health/ready
          curl -fsS https://thongthaispace.com/api/health
```

---

## Section 13: Backup Strategy

### 13.1 RDS Automated Backups (Da cau hinh)
- Daily backups voi 14-ngay retention (dat o Section 3)
- Point-in-time recovery (PITR) toi bat ky giay nao trong retention window
- Backups tu dong trong preferred backup window (03:00-04:00 UTC)

### 13.2 Manual Snapshots truoc khi deploy
```bash
aws rds create-db-snapshot \
  --db-instance-identifier thongthaispace-db-prod \
  --db-snapshot-identifier pre-deploy-$(date +%Y%m%d)
```

### 13.3 Cross-Region Snapshot Copy (Disaster Recovery)
```bash
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:ap-southeast-1:ACCOUNT_ID:snapshot:pre-deploy-20260401 \
  --target-db-snapshot-identifier thongthaispace-dr-20260401 \
  --source-region ap-southeast-1 \
  --region ap-northeast-1
```

### 13.4 Export ra S3 (Luu tru dai han)
```bash
aws s3 mb s3://thongthaispace-db-backups --region ap-southeast-1

# S3 lifecycle cho 90-ngay retention
aws s3api put-bucket-lifecycle-configuration --bucket thongthaispace-db-backups \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "expire-old-exports",
      "Status": "Enabled",
      "Expiration": {"Days": 90},
      "Filter": {"Prefix": ""}
    }]
  }'
```

---

## Section 14: Security Hardening

### 14.1 AWS WAF
```bash
aws wafv2 create-web-acl \
  --name thongthaispace-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=thongthaispace-waf \
  --rules '[
    {
      "Name": "AWS-AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "OverrideAction": {"None": {}},
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRuleSet"
      }
    },
    {
      "Name": "AWS-AWSManagedRulesSQLiRuleSet",
      "Priority": 2,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesSQLiRuleSet"
        }
      },
      "OverrideAction": {"None": {}},
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "SQLiRuleSet"
      }
    },
    {
      "Name": "RateLimitRule",
      "Priority": 3,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 300,
          "AggregateKeyType": "IP"
        }
      },
      "Action": {"Block": {}},
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimit"
      }
    }
  ]' \
  --region ap-southeast-1

# Gan WAF voi ALB
aws wafv2 associate-web-acl \
  --web-acl-arn WAF_ACL_ARN \
  --resource-arn $ALB_ARN \
  --region ap-southeast-1
```

### 14.2 VPC Flow Logs
```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids $VPC_ID \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /vpc/thongthaispace-flow-logs \
  --deliver-logs-permission-arn arn:aws:iam::ACCOUNT_ID:role/vpc-flow-logs-role
```

### 14.3 CloudTrail
```bash
aws cloudtrail create-trail \
  --name thongthaispace-trail \
  --s3-bucket-name thongthaispace-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation

aws cloudtrail start-logging --name thongthaispace-trail
```

### 14.4 Security Checklist
- [ ] RDS khong co public IP (`--no-publicly-accessible`)
- [ ] ElastiCache trong private subnets
- [ ] ECS tasks trong private subnets
- [ ] ALB la duy nhat public-facing resource
- [ ] Security groups theo least privilege (ECS -> RDS/Redis only)
- [ ] Secrets trong Secrets Manager, khong hardcoded
- [ ] ECR image scanning da bat
- [ ] WAF gan voi ALB
- [ ] VPC Flow Logs da bat
- [ ] CloudTrail da bat
- [ ] IAM roles dung least privilege
- [ ] MFA tren root account va admin users
- [ ] Budget alerts da cau hinh

---

## Section 15: Development Environment

### 15.1 Tao Dev Resources (Specs thap hon)
```bash
# Dev RDS - nho nhat
aws rds create-db-instance \
  --db-instance-identifier thongthaispace-db-dev \
  --db-instance-class db.t4g.micro \
  --engine postgres --engine-version 16.4 \
  --master-username thongthai \
  --master-user-password "$DEV_DB_PASSWORD" \
  --db-name thongthai_space \
  --allocated-storage 20 --storage-type gp3 \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name thongthaispace-db-subnets \
  --no-publicly-accessible \
  --backup-retention-period 1 \
  --no-deletion-protection

# Dev ElastiCache - nho nhat
aws elasticache create-cache-cluster \
  --cache-cluster-id thongthaispace-redis-dev \
  --cache-node-type cache.t4g.micro \
  --engine redis --engine-version 7.1 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name thongthaispace-redis-subnets \
  --security-group-ids $REDIS_SG

# Dev ECS services - desired-count=1
aws ecs create-service \
  --cluster thongthaispace-prod \
  --service-name thongthaispace-backend-dev \
  --task-definition thongthaispace-backend-dev \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIV_SUBNET_1],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$DEV_BACKEND_TG_ARN,containerName=backend,containerPort=4000"
```

### 15.2 Dev CI/CD
- Deploy tu branch `develop`
- Dung cung ECS cluster voi services rieng (`*-dev`)
- ALB rieng hoac listener rules rieng voi host-based routing (`dev.thongthaispace.com`, `dev-api.thongthaispace.com`)

---

## Section 16: Uoc tinh Chi phi (AWS)

### Production (Hang thang)
| Dich vu | Cau hinh | Uoc tinh |
|---------|----------|----------|
| ECS Fargate Backend | 0.5 vCPU, 1GB, 2 tasks | ~$30-45 |
| ECS Fargate Frontend | 0.25 vCPU, 0.5GB, 2 tasks | ~$15-25 |
| RDS PostgreSQL 16 | db.t4g.micro, 20GB gp3 | ~$15-20 |
| ElastiCache Redis | cache.t4g.micro, 0.5GB | ~$12-15 |
| ALB | Fixed + LCU charges | ~$20-30 |
| NAT Gateway | Fixed + data processing | ~$35-45 |
| S3 (uploads) | 10GB + requests | ~$1-3 |
| Route 53 | 1 hosted zone + queries | ~$1 |
| ACM (SSL) | Mien phi | $0 |
| ECR | Image storage | ~$1-3 |
| CloudWatch | Metrics, logs, alarms | ~$5-15 |
| WAF | Web ACL + rules | ~$6-10 |
| Secrets Manager | 10 secrets | ~$4 |
| **TONG PRODUCTION** | | **~$145-215/thang** |

### Development (Hang thang)
| Dich vu | Cau hinh | Uoc tinh |
|---------|----------|----------|
| ECS Fargate Backend | 0.5 vCPU, 1GB, 1 task | ~$15-20 |
| ECS Fargate Frontend | 0.25 vCPU, 0.5GB, 1 task | ~$8-12 |
| RDS PostgreSQL | db.t4g.micro, 20GB | ~$15-20 |
| ElastiCache Redis | cache.t4g.micro | ~$12-15 |
| NAT Gateway (shared) | Da tinh trong prod | $0 (shared) |
| **TONG DEVELOPMENT** | | **~$50-67/thang** |

**Meo tiet kiem:**
- RDS Reserved Instances (1 nam): ~40% savings
- ECS Fargate Spot: tiet kiem toi 70% tren non-critical tasks
- NAT Gateway la chi phi co dinh cao nhat. Xem xet NAT instances (~$5/thang) cho dev
- Dung VPC endpoints cho ECR/S3 de giam NAT data processing costs
- Dung Graviton (ARM) instances (da dung t4g) cho price/performance tot nhat

---

## Section 17: Kiem tra End-to-End

```bash
# 1. Backend health (liveness)
curl -v https://api.thongthaispace.com/api/health/live
# Ky vong: 200 OK

# 2. Backend health (readiness - kiem tra DB + Redis)
curl -v https://api.thongthaispace.com/api/health/ready
# Ky vong: 200 OK voi status info

# 3. Frontend health
curl -v https://thongthaispace.com/api/health
# Ky vong: 200 OK

# 4. Frontend loads
curl -v https://thongthaispace.com/
# Ky vong: 200 OK, noi dung HTML

# 5. WebSocket connection
npx wscat -c "wss://api.thongthaispace.com/socket.io/?EIO=4&transport=websocket"
# Ky vong: Ket noi thanh cong

# 6. SSL certificate
openssl s_client -connect thongthaispace.com:443 -servername thongthaispace.com \
  < /dev/null 2>/dev/null | openssl x509 -noout -dates

# 7. CORS
curl -v -H "Origin: https://thongthaispace.com" \
  https://api.thongthaispace.com/api/health/live
# Ky vong: Access-Control-Allow-Origin: https://thongthaispace.com

# 8. HTTP -> HTTPS redirect
curl -v http://thongthaispace.com/
# Ky vong: 301 redirect sang https://

# 9. Database migrations
aws ecs execute-command --cluster thongthaispace-prod \
  --task TASK_ID --container backend --interactive \
  --command "npx prisma migrate status"
# Ky vong: 10 migrations da apply

# 10. Rate limiting
for i in $(seq 1 105); do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.thongthaispace.com/api/health/live
done
# Ky vong: 429 sau ~100 requests

# 11. ECS service stability
aws ecs describe-services --cluster thongthaispace-prod \
  --services thongthaispace-backend thongthaispace-frontend
# Ky vong: runningCount = desiredCount, khong co failed deployments

# 12. CloudWatch logs
aws logs tail /ecs/thongthaispace-backend --since 1h
# Ky vong: Khong co ERROR, "[entrypoint] Starting NestJS app" hien thi
```

---

## So sanh GCP vs AWS

| Khia canh | GCP (Cloud Run) | AWS (ECS Fargate) |
|-----------|-----------------|-------------------|
| Compute model | Serverless (scale to zero) | Container orchestration (min 1 task) |
| Networking | VPC Connector | NAT Gateway (~$35/thang co dinh) |
| Database | Cloud SQL (dat hon) | RDS (re hon o low tier) |
| Redis | Memorystore ($35/thang min) | ElastiCache ($12/thang min) |
| WebSocket | Gen2 required, 1h timeout max | ALB native, can stickiness |
| SSL | Tu dong hoac qua LB | ACM (mien phi, tu dong renew) |
| CI/CD auth | Workload Identity Federation | OIDC Provider |
| Cold starts | Co the voi min=0 | Khong cold starts (luon chay) |
| Chi phi prod | ~$160-230/thang | ~$145-215/thang |
| Chi phi dev | ~$60-80/thang | ~$50-67/thang |
| Do phuc tap | Thap hon (managed services) | Cao hon (nhieu moving parts) |

---

## Cac file can chinh sua truoc khi deploy

| File | Thay doi |
|------|----------|
| `frontend/Dockerfile` | Them `ARG NEXT_PUBLIC_API_URL`, `ARG NEXT_PUBLIC_SOCKET_URL`, `ENV` tuong ung vao builder stage |
| `.github/workflows/deploy-aws.yml` | Tao moi (xem Section 12) |

---

> **Tao boi:** Claude Opus 4.6 - Kiem tra toan bo codebase ThongThaiSpace
> **Ngay tao:** 2026-04-01
