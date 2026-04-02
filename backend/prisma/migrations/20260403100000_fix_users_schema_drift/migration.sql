-- Fix production drift where Prisma User model contains fields that may be missing in DB.
-- This migration is idempotent and safe to run multiple times.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "googleId" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifyToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerifyTokenExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "avatar" TEXT,
  ADD COLUMN IF NOT EXISTS "locale" "Language" DEFAULT 'EN',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "aiQuotaUsedTokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiQuotaLimitTokens" INTEGER NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS "aiQuotaResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_emailVerifyToken_key" ON "users"("emailVerifyToken");
