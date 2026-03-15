-- CreateEnum
CREATE TYPE "AiApplyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ai_apply_requests" (
    "id" TEXT NOT NULL,
    "status" "AiApplyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "plan" JSONB NOT NULL,
    "objective" TEXT,
    "constraints" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_apply_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_apply_requests_projectId_status_idx" ON "ai_apply_requests"("projectId", "status");

-- CreateIndex
CREATE INDEX "ai_apply_requests_requesterId_createdAt_idx" ON "ai_apply_requests"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_apply_requests_status_createdAt_idx" ON "ai_apply_requests"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_apply_requests" ADD CONSTRAINT "ai_apply_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_apply_requests" ADD CONSTRAINT "ai_apply_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_apply_requests" ADD CONSTRAINT "ai_apply_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
