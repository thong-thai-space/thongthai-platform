# 🚀 Thông Thái Space — Kế Hoạch Thực Hiện Toàn Diện

> **Nền tảng công nghệ cung cấp giải pháp web/app + AI cho doanh nghiệp**
> Stack: NestJS + Next.js + PostgreSQL + Redis + Anthropic AI
> Deploy: Free tier (Vercel + Railway + Neon + Upstash)

---

## 📋 Mục Lục

- [Phase 0: Chuẩn bị môi trường](#phase-0-chuẩn-bị-môi-trường)
- [Phase 1: Khởi tạo project](#phase-1-khởi-tạo-project)
- [Phase 2: Backend — NestJS Core](#phase-2-backend--nestjs-core)
- [Phase 3: Database & Models](#phase-3-database--models)
- [Phase 4: Authentication & Authorization](#phase-4-authentication--authorization)
- [Phase 5: Business Modules](#phase-5-business-modules)
- [Phase 6: Anthropic AI Integration](#phase-6-anthropic-ai-integration)
- [Phase 7: Frontend — Next.js](#phase-7-frontend--nextjs)
- [Phase 8: Landing Page](#phase-8-landing-page)
- [Phase 9: Dashboard nội bộ](#phase-9-dashboard-nội-bộ)
- [Phase 10: Client Portal](#phase-10-client-portal)
- [Phase 11: AI Features UI](#phase-11-ai-features-ui)
- [Phase 12: Realtime & Notifications](#phase-12-realtime--notifications)
- [Phase 13: Testing](#phase-13-testing)
- [Phase 14: Docker & Local Development](#phase-14-docker--local-development)
- [Phase 15: Deploy Production (Free Tier)](#phase-15-deploy-production-free-tier)
- [Phase 16: CI/CD & Monitoring](#phase-16-cicd--monitoring)
- [Prompts AI cho từng Phase](#prompts-ai-cho-từng-phase)

---

## Phase 0: Chuẩn bị môi trường

### Cài đặt cần thiết

```powershell
# 1. Node.js 20+ (LTS)
# Download: https://nodejs.org/ hoặc dùng nvm-windows
nvm install 20
nvm use 20

# 2. Kiểm tra phiên bản
node -v    # >= 20.x
npm -v     # >= 10.x

# 3. Cài pnpm (package manager nhanh hơn npm)
npm install -g pnpm

# 4. Cài NestJS CLI
npm install -g @nestjs/cli

# 5. Docker Desktop (đã có)
docker --version

# 6. Git
git --version

# 7. VS Code Extensions cần cài:
#    - ESLint
#    - Prettier
#    - Prisma
#    - NestJS Snippets
#    - Tailwind CSS IntelliSense
#    - Thunder Client (test API)
```

### Tạo thư mục project

```powershell
# Chọn vị trí bạn muốn
mkdir D:\Thai\root\thongthai-space
cd D:\Thai\root\thongthai-space
git init
```

### Tạo accounts (free tier)

| Dịch vụ | URL | Dùng cho |
|---------|-----|----------|
| Vercel | https://vercel.com | Deploy Next.js frontend |
| Railway | https://railway.app | Deploy NestJS backend |
| Neon | https://neon.tech | PostgreSQL database |
| Upstash | https://upstash.com | Redis cache |
| Cloudflare R2 | https://dash.cloudflare.com | File storage |
| Resend | https://resend.com | Email service |
| Anthropic | https://console.anthropic.com | AI API |
| GitHub | https://github.com | Source code |

---

## Phase 1: Khởi tạo project

### Bước 1.1: Tạo Monorepo structure

```powershell
cd D:\Thai\root\thongthai-space

# Tạo cấu trúc monorepo
mkdir backend frontend shared
```

### Bước 1.2: Khởi tạo Backend (NestJS)

```powershell
cd D:\Thai\root\thongthai-space

# Tạo NestJS project
nest new backend --package-manager pnpm --strict

# Cài dependencies core
cd backend
#pnpm add @nestjs/config @nestjs/swagger
pnpm add @prisma/client @nestjs/throttler
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
pnpm add @nestjs/cache-manager cache-manager cache-manager-ioredis-yet ioredis
pnpm add bcryptjs class-validator class-transformer
pnpm add @anthropic-ai/sdk
pnpm add helmet compression cookie-parser
pnpm add -D prisma @types/bcryptjs @types/passport-jwt @types/cookie-parser
```

### Bước 1.3: Khởi tạo Frontend (Next.js)

```powershell
cd D:\Thai\root\thongthai-space

# Tạo Next.js project
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm

# Cài dependencies
cd frontend
pnpm add @tanstack/react-query axios socket.io-client
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-avatar @radix-ui/react-tabs
pnpm add lucide-react clsx tailwind-merge
pnpm add framer-motion
pnpm add react-hook-form @hookform/resolvers zod
pnpm add date-fns
pnpm add react-markdown
```

### Bước 1.4: Cấu trúc thư mục hoàn chỉnh

```
thongthai-space/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # Authentication & Authorization
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── local.strategy.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   │
│   │   │   ├── user/              # User & Team management
│   │   │   │   ├── user.module.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── project/           # Project management
│   │   │   │   ├── project.module.ts
│   │   │   │   ├── project.controller.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── task/              # Task management
│   │   │   │   ├── task.module.ts
│   │   │   │   ├── task.controller.ts
│   │   │   │   ├── task.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── client/            # Client management
│   │   │   │   ├── client.module.ts
│   │   │   │   ├── client.controller.ts
│   │   │   │   ├── client.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── invoice/           # Invoicing & Payment
│   │   │   │   ├── invoice.module.ts
│   │   │   │   ├── invoice.controller.ts
│   │   │   │   ├── invoice.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── portfolio/         # Portfolio showcase
│   │   │   │   ├── portfolio.module.ts
│   │   │   │   ├── portfolio.controller.ts
│   │   │   │   ├── portfolio.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── ai/                # Anthropic AI integration
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   └── prompts/
│   │   │   │       ├── code-review.prompt.ts
│   │   │   │       ├── proposal.prompt.ts
│   │   │   │       └── task-breakdown.prompt.ts
│   │   │   │
│   │   │   ├── notification/      # Notifications
│   │   │   │   ├── notification.module.ts
│   │   │   │   ├── notification.gateway.ts  # Socket.IO
│   │   │   │   └── notification.service.ts
│   │   │   │
│   │   │   └── file/              # File upload & storage
│   │   │       ├── file.module.ts
│   │   │       ├── file.controller.ts
│   │   │       └── file.service.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── decorators/        # Custom decorators
│   │   │   ├── filters/           # Exception filters
│   │   │   ├── interceptors/      # Logging, transform
│   │   │   ├── pipes/             # Validation pipes
│   │   │   └── utils/             # Helpers
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── schema.prisma
│   │   │
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── test/
│   ├── Dockerfile
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (landing)/         # Landing page (public)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── about/
│   │   │   │   ├── services/
│   │   │   │   ├── portfolio/
│   │   │   │   └── contact/
│   │   │   │
│   │   │   ├── (auth)/            # Auth pages
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   │
│   │   │   ├── dashboard/         # Internal dashboard
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx       # Overview
│   │   │   │   ├── projects/
│   │   │   │   ├── tasks/
│   │   │   │   ├── clients/
│   │   │   │   ├── invoices/
│   │   │   │   ├── team/
│   │   │   │   ├── ai-assistant/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── portal/            # Client portal
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   ├── invoices/
│   │   │   │   └── messages/
│   │   │   │
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                # Reusable UI components
│   │   │   ├── landing/           # Landing page components
│   │   │   ├── dashboard/         # Dashboard components
│   │   │   └── portal/            # Client portal components
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts             # API client (axios)
│   │   │   ├── auth.ts            # Auth utilities
│   │   │   ├── socket.ts          # Socket.IO client
│   │   │   └── utils.ts           # Helpers
│   │   │
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── stores/                # State management
│   │   └── types/                 # TypeScript types
│   │
│   ├── public/
│   ├── Dockerfile
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .gitignore
├── .env.example
├── README.md
└── package.json                   # Root workspace scripts
```

---

## Phase 2: Backend — NestJS Core

### Bước 2.1: Cấu hình NestJS

**File: `backend/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,           // Auto-transform types
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Thông Thái Space API')
    .setDescription('API for project management, client portal & AI assistant')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Thông Thái Space API running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
```

**File: `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { ClientModule } from './modules/client/client.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationModule } from './modules/notification/notification.module';
import { FileModule } from './modules/file/file.module';

@Module({
  imports: [
    // Environment config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minute
      limit: 100,   // 100 requests per minute
    }]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UserModule,
    ProjectModule,
    TaskModule,
    ClientModule,
    InvoiceModule,
    PortfolioModule,
    AiModule,
    NotificationModule,
    FileModule,
  ],
})
export class AppModule {}
```

### Bước 2.2: Prisma Setup

```powershell
cd backend
npx prisma init --datasource-provider postgresql
```

---

## Phase 3: Database & Models

### Bước 3.1: Prisma Schema

**File: `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  OWNER       // Chủ doanh nghiệp (bạn)
  ADMIN       // Quản trị viên
  MEMBER      // Thành viên team
  CLIENT      // Khách hàng
}

enum ProjectStatus {
  DRAFT
  PROPOSAL_SENT
  IN_PROGRESS
  ON_HOLD
  REVIEW
  COMPLETED
  CANCELLED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_UPDATED
  PROJECT_UPDATE
  INVOICE_PAID
  CLIENT_MESSAGE
  AI_COMPLETED
  SYSTEM
}

// ==================== MODELS ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  avatar        String?
  phone         String?
  role          UserRole  @default(CLIENT)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  ownedProjects   Project[]       @relation("ProjectOwner")
  assignedTasks   Task[]          @relation("TaskAssignee")
  createdTasks    Task[]          @relation("TaskCreator")
  comments        Comment[]
  notifications   Notification[]
  aiConversations AiConversation[]
  invoicesCreated Invoice[]       @relation("InvoiceCreator")
  timeEntries     TimeEntry[]
  activities      Activity[]

  // Client relations
  clientProjects  Project[]   @relation("ProjectClient")
  clientInvoices  Invoice[]   @relation("InvoiceClient")

  @@map("users")
}

model Project {
  id            String        @id @default(cuid())
  name          String
  description   String?
  status        ProjectStatus @default(DRAFT)
  startDate     DateTime?
  endDate       DateTime?
  deadline      DateTime?
  budget        Decimal?      @db.Decimal(15, 2)
  currency      String        @default("VND")

  // Tech stack & metadata
  techStack     String[]      @default([])
  repoUrl       String?
  liveUrl       String?
  figmaUrl      String?

  // Relations
  ownerId       String
  owner         User          @relation("ProjectOwner", fields: [ownerId], references: [id])
  clientId      String?
  client        User?         @relation("ProjectClient", fields: [clientId], references: [id])

  tasks         Task[]
  invoices      Invoice[]
  comments      Comment[]
  files         ProjectFile[]
  milestones    Milestone[]
  activities    Activity[]

  // Portfolio
  isShowcase    Boolean       @default(false)
  showcaseOrder Int?
  thumbnailUrl  String?
  screenshots   String[]      @default([])

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("projects")
}

model Task {
  id            String       @id @default(cuid())
  title         String
  description   String?
  status        TaskStatus   @default(TODO)
  priority      TaskPriority @default(MEDIUM)
  dueDate       DateTime?
  estimatedHours Float?
  actualHours   Float?
  order         Int          @default(0)

  // Relations
  projectId     String
  project       Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId    String?
  assignee      User?        @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creatorId     String
  creator       User         @relation("TaskCreator", fields: [creatorId], references: [id])
  parentId      String?
  parent        Task?        @relation("SubTasks", fields: [parentId], references: [id])
  subTasks      Task[]       @relation("SubTasks")
  milestoneId   String?
  milestone     Milestone?   @relation(fields: [milestoneId], references: [id])

  comments      Comment[]
  timeEntries   TimeEntry[]
  labels        String[]     @default([])

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@map("tasks")
}

model Milestone {
  id            String    @id @default(cuid())
  title         String
  description   String?
  dueDate       DateTime?
  isCompleted   Boolean   @default(false)
  completedAt   DateTime?

  projectId     String
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks         Task[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("milestones")
}

model Comment {
  id          String   @id @default(cuid())
  content     String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)

  // AI-generated flag
  isAiGenerated Boolean @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("comments")
}

model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  status        InvoiceStatus @default(DRAFT)
  issueDate     DateTime      @default(now())
  dueDate       DateTime
  subtotal      Decimal       @db.Decimal(15, 2)
  tax           Decimal       @default(0) @db.Decimal(15, 2)
  discount      Decimal       @default(0) @db.Decimal(15, 2)
  total         Decimal       @db.Decimal(15, 2)
  currency      String        @default("VND")
  notes         String?

  // Relations
  projectId     String?
  project       Project?      @relation(fields: [projectId], references: [id])
  clientId      String
  client        User          @relation("InvoiceClient", fields: [clientId], references: [id])
  creatorId     String
  creator       User          @relation("InvoiceCreator", fields: [creatorId], references: [id])
  items         InvoiceItem[]

  paidAt        DateTime?
  paidAmount    Decimal?      @db.Decimal(15, 2)
  paymentMethod String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("invoices")
}

model InvoiceItem {
  id          String  @id @default(cuid())
  description String
  quantity    Float   @default(1)
  unitPrice   Decimal @db.Decimal(15, 2)
  amount      Decimal @db.Decimal(15, 2)

  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@map("invoice_items")
}

model TimeEntry {
  id          String   @id @default(cuid())
  description String?
  hours       Float
  date        DateTime @default(now())
  billable    Boolean  @default(true)

  userId      String
  user        User     @relation(fields: [userId], references: [id])
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id])

  createdAt   DateTime @default(now())

  @@map("time_entries")
}

model ProjectFile {
  id          String  @id @default(cuid())
  name        String
  url         String
  mimeType    String
  size        Int     // bytes
  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  uploadedBy  String

  createdAt   DateTime @default(now())

  @@map("project_files")
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  data      Json?            // Additional metadata

  userId    String
  user      User             @relation(fields: [userId], references: [id])

  createdAt DateTime         @default(now())

  @@index([userId, isRead])
  @@map("notifications")
}

model AiConversation {
  id        String      @id @default(cuid())
  title     String?
  context   String?     // project/task context
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  messages  AiMessage[]

  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@map("ai_conversations")
}

model AiMessage {
  id             String         @id @default(cuid())
  role           String         // 'user' | 'assistant'
  content        String
  tokenUsage     Int?
  conversationId String
  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  createdAt      DateTime       @default(now())

  @@map("ai_messages")
}

model Activity {
  id          String   @id @default(cuid())
  action      String   // 'created', 'updated', 'deleted', 'status_changed'
  entityType  String   // 'project', 'task', 'invoice'
  entityId    String
  details     Json?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id])

  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@map("activities")
}
```

### Bước 3.2: Prisma Service

**File: `backend/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**File: `backend/src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Bước 3.3: Chạy migration

```powershell
cd backend

# Tạo migration đầu tiên
npx prisma migrate dev --name init

# Tạo Prisma Client
npx prisma generate
```

---

## Phase 4: Authentication & Authorization

### Bước 4.1: Auth Module

**File: `backend/src/modules/auth/dto/register.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

**File: `backend/src/modules/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**File: `backend/src/modules/auth/auth.service.ts`**

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.role);
  }

  private async generateTokens(userId: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: this.configService.getOrThrow('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, role, type: 'refresh' },
        {
          secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
```

**File: `backend/src/modules/auth/strategies/jwt.strategy.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;
  }
}
```

**File: `backend/src/modules/auth/guards/roles.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) =>
  (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
    return descriptor ?? target;
  };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

---

## Phase 5: Business Modules

### Bước 5.1: Project Module (ví dụ mẫu — các module khác tương tự)

**File: `backend/src/modules/project/project.service.ts`**

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: UserRole) {
    if (role === UserRole.CLIENT) {
      return this.prisma.project.findMany({
        where: { clientId: userId },
        include: { tasks: { select: { id: true, status: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // OWNER, ADMIN, MEMBER can see all projects
    return this.prisma.project.findMany({
      include: {
        client: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, status: true } },
        _count: { select: { tasks: true, invoices: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        tasks: {
          orderBy: { order: 'asc' },
          include: { assignee: { select: { id: true, name: true, avatar: true } } },
        },
        milestones: { orderBy: { dueDate: 'asc' } },
        invoices: true,
        files: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    // Clients can only see their own projects
    if (role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }

    return project;
  }

  async create(data: any, userId: string) {
    return this.prisma.project.create({
      data: { ...data, ownerId: userId },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  // Portfolio: get showcased projects (public)
  async getShowcase() {
    return this.prisma.project.findMany({
      where: { isShowcase: true },
      select: {
        id: true,
        name: true,
        description: true,
        techStack: true,
        liveUrl: true,
        thumbnailUrl: true,
        screenshots: true,
        showcaseOrder: true,
      },
      orderBy: { showcaseOrder: 'asc' },
    });
  }
}
```

### Bước 5.2: Các module còn lại

Tạo tương tự cho: `TaskModule`, `ClientModule`, `InvoiceModule`, `PortfolioModule`, `FileModule`, `NotificationModule`.

Mỗi module gồm: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts`.

---

## Phase 6: Anthropic AI Integration

### Bước 6.1: AI Service

**File: `backend/src/modules/ai/ai.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CODE_REVIEW_PROMPT,
  PROPOSAL_PROMPT,
  TASK_BREAKDOWN_PROMPT,
  GENERAL_ASSISTANT_PROMPT
} from './prompts';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
  }

  // ==================== CHAT (Streaming) ====================

  async chat(conversationId: string, userMessage: string, userId: string) {
    // Get or create conversation
    let conversation = conversationId
      ? await this.prisma.aiConversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
        })
      : null;

    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: { userId, title: userMessage.substring(0, 100) },
        include: { messages: true },
      });
    }

    // Save user message
    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: userMessage,
      },
    });

    // Build message history
    const messages = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    messages.push({ role: 'user', content: userMessage });

    // Call Anthropic API
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: GENERAL_ASSISTANT_PROMPT,
      messages,
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Save assistant response
    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        tokenUsage: response.usage.input_tokens + response.usage.output_tokens,
      },
    });

    return {
      conversationId: conversation.id,
      message: assistantMessage,
      usage: response.usage,
    };
  }

  // ==================== SMART FEATURES ====================

  /** AI phân tích yêu cầu khách hàng → tạo proposal */
  async generateProposal(clientRequirements: string, budget?: string) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: PROPOSAL_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Client requirements:\n${clientRequirements}\n\nBudget: ${budget || 'Not specified'}`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /** AI tự động chia nhỏ task từ project description */
  async breakdownTasks(projectDescription: string, techStack: string[]) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: TASK_BREAKDOWN_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Project: ${projectDescription}\nTech Stack: ${techStack.join(', ')}`,
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from AI response
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      return jsonMatch ? JSON.parse(jsonMatch[1]) : { raw: content };
    } catch {
      return { raw: content };
    }
  }

  /** AI review code và đề xuất cải tiến */
  async reviewCode(code: string, language: string, context?: string) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: CODE_REVIEW_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Language: ${language}\nContext: ${context || 'General'}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /** AI ước lượng thời gian và chi phí */
  async estimateProject(requirements: string) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a senior project estimator at a Vietnamese tech company. 
Estimate development time and cost in VND. Be realistic.
Return JSON format: { phases: [], totalHours: number, estimatedCost: { min: number, max: number }, timeline: string }`,
      messages: [
        { role: 'user', content: requirements },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      return jsonMatch ? JSON.parse(jsonMatch[1]) : { raw: content };
    } catch {
      return { raw: content };
    }
  }

  /** AI tạo báo cáo tiến độ tự động */
  async generateProgressReport(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        milestones: true,
        timeEntries: { include: { user: { select: { name: true } } } },
      },
    });

    if (!project) throw new Error('Project not found');

    const taskSummary = {
      total: project.tasks.length,
      done: project.tasks.filter((t) => t.status === 'DONE').length,
      inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blocked: project.tasks.filter((t) => t.status === 'BLOCKED').length,
    };

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a project manager assistant. Generate a professional progress report in Vietnamese for the client.`,
      messages: [
        {
          role: 'user',
          content: `Project: ${project.name}\nStatus: ${project.status}\nTask Summary: ${JSON.stringify(taskSummary)}\nMilestones: ${JSON.stringify(project.milestones)}`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}
```

### Bước 6.2: AI Prompts

**File: `backend/src/modules/ai/prompts/index.ts`**

```typescript
export const GENERAL_ASSISTANT_PROMPT = `You are the AI assistant for "Thông Thái Space" - a Vietnamese tech company providing web/app development solutions.

Your capabilities:
- Help with project planning and estimation
- Code review and suggestions
- Technical architecture advice
- Client communication drafts
- Task breakdown and prioritization

Respond in the same language the user uses (Vietnamese or English).
Be concise, professional, and actionable.`;

export const PROPOSAL_PROMPT = `You are a business analyst at "Thông Thái Space" - a Vietnamese tech company.

Generate a professional project proposal based on client requirements. Include:
1. Project overview & understanding
2. Proposed solution & tech stack
3. Development phases with timeline
4. Deliverables per phase
5. Team composition
6. Pricing estimate (in VND)
7. Terms & conditions

Format as clean Markdown. Use Vietnamese.`;

export const TASK_BREAKDOWN_PROMPT = `You are a senior tech lead. Break down a project into actionable development tasks.

Return JSON format:
\`\`\`json
{
  "milestones": [
    {
      "title": "Phase name",
      "tasks": [
        {
          "title": "Task name",
          "description": "What to do",
          "estimatedHours": 4,
          "priority": "HIGH|MEDIUM|LOW",
          "labels": ["frontend", "backend", "design"]
        }
      ]
    }
  ]
}
\`\`\`

Be specific and realistic with estimates.`;

export const CODE_REVIEW_PROMPT = `You are a senior code reviewer. Review the provided code for:
1. Security vulnerabilities (OWASP Top 10)
2. Performance issues
3. Code quality and best practices
4. Potential bugs
5. Suggestions for improvement

Be specific with line references. Rate severity: Critical, High, Medium, Low.`;
```

### Bước 6.3: AI Controller

**File: `backend/src/modules/ai/ai.controller.ts`**

```typescript
import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  async chat(
    @Body() body: { message: string; conversationId?: string },
    @Req() req,
  ) {
    return this.aiService.chat(body.conversationId, body.message, req.user.id);
  }

  @Post('generate-proposal')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async generateProposal(
    @Body() body: { requirements: string; budget?: string },
  ) {
    const proposal = await this.aiService.generateProposal(body.requirements, body.budget);
    return { proposal };
  }

  @Post('breakdown-tasks')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  async breakdownTasks(
    @Body() body: { description: string; techStack: string[] },
  ) {
    return this.aiService.breakdownTasks(body.description, body.techStack);
  }

  @Post('review-code')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  async reviewCode(
    @Body() body: { code: string; language: string; context?: string },
  ) {
    const review = await this.aiService.reviewCode(body.code, body.language, body.context);
    return { review };
  }

  @Post('estimate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async estimate(@Body() body: { requirements: string }) {
    return this.aiService.estimateProject(body.requirements);
  }

  @Post('progress-report/:projectId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async progressReport(@Param('projectId') projectId: string) {
    const report = await this.aiService.generateProgressReport(projectId);
    return { report };
  }
}
```

---

## Phase 7: Frontend — Next.js

### Bước 7.1: API Client

**File: `frontend/src/lib/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// Auto-attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken },
        );
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

### Bước 7.2: Auth Context

**File: `frontend/src/lib/auth.tsx`**

```typescript
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isOwnerOrAdmin: boolean;
  isTeamMember: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      isOwnerOrAdmin: user?.role === 'OWNER' || user?.role === 'ADMIN',
      isTeamMember: ['OWNER', 'ADMIN', 'MEMBER'].includes(user?.role || ''),
      isClient: user?.role === 'CLIENT',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Phase 8: Landing Page

### Bước 8.1: Trang chính

**File: `frontend/src/app/(landing)/page.tsx`**

Cấu trúc landing page:

```
Trang chủ Thông Thái Space
├── Hero Section — tagline + CTA
├── Services Section — Web, App, AI, Consulting
├── Portfolio Section — Dự án showcase
├── Process Section — Quy trình làm việc (4 bước)
├── Testimonials — Đánh giá khách hàng
├── AI Demo Section — Demo AI assistant
├── Team Section — Giới thiệu team
├── Contact Section — Form liên hệ
└── Footer
```

### Bước 8.2: Các trang phụ

| Route | Nội dung |
|-------|----------|
| `/` | Landing page |
| `/about` | Giới thiệu doanh nghiệp |
| `/services` | Chi tiết dịch vụ |
| `/portfolio` | Danh sách dự án đã làm |
| `/portfolio/[id]` | Chi tiết dự án |
| `/contact` | Liên hệ + form báo giá |
| `/blog` | Blog chia sẻ kiến thức (phase sau) |

---

## Phase 9: Dashboard nội bộ

### Bước 9.1: Layout & Navigation

Cấu trúc dashboard:

```
/dashboard
├── Overview — Stats tổng quan (projects, tasks, revenue)
├── /projects — Kanban board dự án
│   └── /projects/[id] — Chi tiết project + tasks
├── /tasks — Task management (board + list view)
├── /clients — Quản lý khách hàng
├── /invoices — Quản lý hóa đơn
│   └── /invoices/create — Tạo hóa đơn
├── /team — Quản lý thành viên
├── /ai-assistant — AI Chat + Tools
├── /files — File manager
├── /reports — Báo cáo (AI-generated)
└── /settings — Cài đặt account & company
```

### Bước 9.2: Dashboard Overview Components

| Component | Chức năng |
|-----------|-----------|
| StatsCards | Active projects, Pending tasks, Revenue, Team members |
| RecentActivity | Timeline hoạt động gần đây |
| TasksChart | Biểu đồ task theo status |
| RevenueChart | Biểu đồ doanh thu theo tháng |
| UpcomingDeadlines | Các deadline sắp tới |
| QuickActions | Tạo project/task/invoice nhanh |

---

## Phase 10: Client Portal

### Bước 10.1: Trang khách hàng

```
/portal
├── Overview — Tổng quan dự án của khách
├── /projects — Danh sách dự án
│   └── /projects/[id] — Tiến độ dự án + milestones
├── /invoices — Hóa đơn + thanh toán
├── /messages — Trao đổi với team
└── /settings — Thông tin tài khoản
```

---

## Phase 11: AI Features UI

### Bước 11.1: AI Assistant Page

```
/dashboard/ai-assistant
├── Chat Interface — Chat realtime với AI
├── Quick Actions:
│   ├── 📋 Tạo Proposal — Nhập yêu cầu → AI tạo báo giá
│   ├── 📊 Ước lượng dự án — AI estimate thời gian + chi phí
│   ├── 🔀 Chia nhỏ Tasks — AI breakdown project → tasks
│   ├── 🔍 Review Code — Paste code → AI review
│   └── 📈 Báo cáo tiến độ — AI tự tạo report cho client
├── Conversation History — Lịch sử chat
└── Usage Stats — Token usage, cost tracking
```

---

## Phase 12: Realtime & Notifications

### Bước 12.1: NestJS WebSocket Gateway

**File: `backend/src/modules/notification/notification.gateway.ts`**

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });
      this.connectedUsers.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send to all team members
  sendToTeam(event: string, data: any) {
    this.server.emit(event, data);
  }
}
```

---

## Phase 13: Testing

### Bước 13.1: Backend Tests

```powershell
cd backend

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

**Ví dụ test:**

```typescript
// backend/src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  it('should register new user', async () => { ... });
  it('should reject duplicate email', async () => { ... });
  it('should login with correct credentials', async () => { ... });
  it('should reject invalid credentials', async () => { ... });
  it('should refresh token', async () => { ... });
});
```

### Bước 13.2: Frontend Tests

```powershell
cd frontend
pnpm test          # Jest + React Testing Library
pnpm test:e2e      # Playwright (optional)
```

---

## Phase 14: Docker & Local Development

### Bước 14.1: Docker Compose

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: pnpm start:dev
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: pnpm dev
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: thongthai_space
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@thongthai.space
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - postgres
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Bước 14.2: Backend .env.example

**File: `backend/.env.example`**

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (Neon free tier for production, local for dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thongthai_space

# JWT
JWT_SECRET=your-jwt-secret-generate-with-openssl-rand-base64-64
JWT_REFRESH_SECRET=your-refresh-secret-generate-with-openssl-rand-base64-64

# Redis (Upstash for production, local for dev)
REDIS_URL=redis://localhost:6379

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=thongthai-space

# Email (Resend)
RESEND_API_KEY=re_your-api-key
FROM_EMAIL=noreply@thongthai.space
```

### Bước 14.3: Chạy local

```powershell
# Cách 1: Docker (khuyến khích)
docker-compose up -d

# Cách 2: Chạy riêng
cd backend && pnpm start:dev    # Terminal 1
cd frontend && pnpm dev          # Terminal 2
# Cần PostgreSQL + Redis chạy sẵn (Docker hoặc local install)
```

---

## Phase 15: Deploy Production (Free Tier)

### Bước 15.1: Database (Neon.tech)

```
1. Đăng nhập https://neon.tech
2. Create Project → "thongthai-space"
3. Copy connection string → backend/.env (DATABASE_URL)
4. Chạy: npx prisma migrate deploy
```

### Bước 15.2: Redis (Upstash)

```
1. Đăng nhập https://upstash.com
2. Create Database → "thongthai-space-redis"
3. Copy REDIS_URL → backend/.env
```

### Bước 15.3: Backend (Railway.app)

```
1. Đăng nhập https://railway.app
2. New Project → Deploy from GitHub repo
3. Select thongthai-space repo, root directory: /backend
4. Add environment variables (từ .env)
5. Railway tự động deploy khi push
```

### Bước 15.4: Frontend (Vercel)

```
1. Đăng nhập https://vercel.com
2. Import Git Repository → thongthai-space
3. Framework: Next.js, root directory: /frontend
4. Add environment variable: NEXT_PUBLIC_API_URL = Railway backend URL
5. Deploy → nhận domain miễn phí: thongthai-space.vercel.app
6. Sau có domain riêng: thongthai.space → trỏ vào Vercel
```

---

## Phase 16: CI/CD & Monitoring

### Bước 16.1: GitHub Actions

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd backend && pnpm install && pnpm test
      - run: cd frontend && pnpm install && pnpm build

  # Vercel auto-deploys frontend on push
  # Railway auto-deploys backend on push
```

### Bước 16.2: Monitoring (Free)

| Tool | Mục đích |
|------|----------|
| Railway Metrics | Backend CPU/Memory |
| Vercel Analytics | Frontend performance |
| Sentry (free tier) | Error tracking |
| UptimeRobot (free) | Uptime monitoring |

---

## Prompts AI cho từng Phase

Dưới đây là các prompt bạn có thể dùng với AI (Copilot, Claude) để hỗ trợ code từng phase:

### Phase 1-2: Setup

```
Prompt: Tạo NestJS project với cấu trúc modular monolith cho "Thông Thái Space" 
- một công ty công nghệ cung cấp giải pháp web/app.

Modules cần có: auth, user, project, task, client, invoice, portfolio, ai, 
notification, file.

Stack: NestJS + Prisma + PostgreSQL + Redis + Socket.IO.
Mỗi module gồm: module.ts, controller.ts, service.ts, dto/.
Cấu hình: Swagger, ValidationPipe, Helmet, CORS, Rate limiting.
```

### Phase 3: Database

```
Prompt: Tạo Prisma schema cho nền tảng quản lý dự án công nghệ "Thông Thái Space".

Entities cần có:
- User (roles: OWNER, ADMIN, MEMBER, CLIENT)
- Project (status tracking, tech stack, budget, portfolio showcase)
- Task (Kanban: TODO/IN_PROGRESS/IN_REVIEW/DONE/BLOCKED, subtasks, labels)
- Milestone
- Invoice + InvoiceItem
- Comment
- TimeEntry
- ProjectFile
- Notification
- AiConversation + AiMessage
- Activity (audit log)

Cần: relations, indexes, enums. PostgreSQL.
```

### Phase 4: Auth

```
Prompt: Implement JWT authentication cho NestJS với:
- Register + Login (bcrypt hashing, 12 rounds)
- Access token (15m) + Refresh token (7d)
- JWT Strategy + Passport
- Role-based guard (OWNER, ADMIN, MEMBER, CLIENT)
- Cookie-based refresh token
- Prisma user lookup

Dùng @nestjs/jwt, @nestjs/passport, passport-jwt, bcryptjs.
```

### Phase 5: Business Modules

```
Prompt: Implement Project Management module cho NestJS + Prisma.

Chức năng:
- CRUD projects với authorization (team xem tất cả, client chỉ xem project của mình)
- Update project status (DRAFT → PROPOSAL_SENT → IN_PROGRESS → REVIEW → COMPLETED)
- Kanban task board (drag & drop order)
- Task CRUD với assignee, labels, subtasks, time tracking
- Milestone tracking
- File upload per project
- Activity log (ai tạo/sửa/xóa gì)
- Portfolio showcase (public endpoint cho landing page)

Return DTO patterns, pagination, filtering, sorting.
```

### Phase 6: AI Integration

```
Prompt: Implement Anthropic Claude AI integration cho NestJS.

Chức năng:
1. Chat assistant (conversation history lưu DB, streaming response)
2. Auto-generate proposal từ client requirements
3. Break down project description → tasks (JSON output)
4. Code review (security, performance, best practices)
5. Estimate project timeline & cost (VND)
6. Auto-generate progress report cho client

Dùng @anthropic-ai/sdk, model claude-sonnet-4-20250514.
Lưu conversation + messages vào Prisma (AiConversation, AiMessage).
Track token usage per user.
```

### Phase 7-8: Frontend Landing

```
Prompt: Tạo landing page cho "Thông Thái Space" bằng Next.js 14 + App Router + 
Tailwind CSS + Framer Motion.

Sections:
- Hero: Tagline "Giải pháp công nghệ thông minh" + CTA "Liên hệ tư vấn"
- Services: 4 cards (Web Development, Mobile App, AI Solutions, Consulting)
- Portfolio: Grid showcase projects (load từ API)
- Process: 4 bước (Tư vấn → Thiết kế → Phát triển → Bàn giao)
- Testimonials: Slider đánh giá khách hàng
- Contact: Form liên hệ + thông tin công ty

Design: Modern, professional, dark/light mode.
Responsive: Desktop + Tablet + Mobile.
SEO: metadata, OpenGraph, structured data.
```

### Phase 9: Dashboard

```
Prompt: Tạo dashboard quản lý nội bộ cho "Thông Thái Space" bằng Next.js 14.

Pages:
- Overview: Stats cards + Charts (dùng recharts) + Recent activity
- Projects: Table + Grid view, filter by status, search
- Project Detail: Info + Kanban tasks + Milestones + Files + Timeline
- Tasks: Kanban board (drag & drop với @dnd-kit/core)
- Clients: Table với search, filter, CRUD
- Invoices: Table + Create form + PDF export
- Team: Member list + roles management
- AI Assistant: Chat UI + Quick actions

Layout: Sidebar navigation + Top header + Main content.
Dùng: @tanstack/react-query, react-hook-form, zod, radix-ui.
```

### Phase 10: Client Portal

```
Prompt: Tạo Client Portal cho "Thông Thái Space" bằng Next.js 14.

Client sau khi login sẽ thấy:
- Dashboard: Overview dự án, tiến độ, upcoming milestones
- Projects: List dự án, xem chi tiết + tiến độ (progress bar)
- Invoices: Xem hóa đơn, trạng thái, nút thanh toán
- Messages: Chat realtime với team (Socket.IO)
- Profile: Cập nhật thông tin cá nhân

UI khác biệt với internal dashboard (color scheme riêng).
Middleware protect routes: chỉ role CLIENT mới vào được.
```

### Phase 11: AI UI

```
Prompt: Tạo AI Assistant UI cho dashboard "Thông Thái Space" bằng Next.js.

Giao diện chat:
- Sidebar: Danh sách conversations (giống ChatGPT)
- Main: Chat messages + Input box
- Messages: Markdown rendering (react-markdown), code syntax highlighting
- Streaming: Hiển thị response từng ký tự (SSE hoặc polling)

Quick Actions (tabs hoặc buttons):
- 📋 Generate Proposal: Textarea input → AI trả Markdown preview
- 📊 Estimate Project: Form fields → AI trả JSON → render table
- 🔀 Breakdown Tasks: Textarea → AI trả tasks → nút "Import to Project"
- 🔍 Code Review: Code editor → AI trả review → highlight issues
- 📈 Progress Report: Select project → AI generate report → export PDF

Footer: Token usage meter (used/limit).
```

### Phase 14: Docker

```
Prompt: Tạo Docker setup cho "Thông Thái Space" monorepo.

Services:
- backend: NestJS app (port 4000)
- frontend: Next.js app (port 3000)
- postgres: PostgreSQL 16 (port 5432)
- redis: Redis 7 (port 6379)
- pgadmin: pgAdmin 4 (port 5050, optional)

Cần:
- docker-compose.yml cho development (hot reload, volumes)
- Dockerfile cho backend (multi-stage, node:20-alpine, non-root user)
- Dockerfile cho frontend (multi-stage, standalone output)
- .dockerignore cho cả 2

Backend Dockerfile cần chạy prisma generate trong build stage.
```

---

## 📅 Timeline ước lượng

| Phase | Thời gian | Output |
|-------|-----------|--------|
| 0-1 | 1 ngày | Project setup, dependencies |
| 2-3 | 2 ngày | NestJS core + Database schema |
| 4 | 1 ngày | Authentication hoàn chỉnh |
| 5 | 3-5 ngày | All business modules |
| 6 | 2 ngày | AI integration |
| 7-8 | 2-3 ngày | Landing page |
| 9 | 3-5 ngày | Dashboard |
| 10 | 2 ngày | Client portal |
| 11 | 2 ngày | AI features UI |
| 12 | 1 ngày | Realtime notifications |
| 13 | 2 ngày | Testing |
| 14-16 | 1-2 ngày | Docker + Deploy + CI/CD |
| **Tổng** | **~3-4 tuần** | **MVP hoàn chỉnh** |

---

## 🔑 Environment Variables Checklist

Trước khi deploy, đảm bảo có đủ:

```
✅ DATABASE_URL          → Neon.tech connection string
✅ JWT_SECRET            → openssl rand -base64 64
✅ JWT_REFRESH_SECRET    → openssl rand -base64 64
✅ ANTHROPIC_API_KEY     → console.anthropic.com
✅ REDIS_URL             → Upstash connection string
✅ FRONTEND_URL          → Vercel domain
✅ RESEND_API_KEY        → resend.com (email)
✅ R2_* keys             → Cloudflare R2 (file storage)
```

---

*Document created for Thông Thái Space — Phase 1 MVP*
*Stack: NestJS + Next.js + PostgreSQL + Redis + Anthropic AI*
*Last updated: March 2026*
