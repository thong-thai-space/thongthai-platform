-- Add OAuth and legal consent columns for users.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "googleId" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifyToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerifyTokenExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3);

-- Keep indexes idempotent so this migration can be applied safely if some columns already exist.
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_emailVerifyToken_key" ON "users"("emailVerifyToken");
