-- CreateEnum
CREATE TYPE "AiFeature" AS ENUM ('CHAT', 'PROPOSAL', 'TASK_BREAKDOWN', 'CODE_REVIEW', 'ESTIMATE', 'PROGRESS_REPORT', 'STRATEGIC_PLAN', 'APPLY_STRATEGIC_PLAN', 'PUBLIC_CHAT');

-- CreateTable
CREATE TABLE "ai_usage_audits" (
    "id" TEXT NOT NULL,
    "feature" "AiFeature" NOT NULL,
    "model" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(12,6),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "effectivenessScore" INTEGER,
    "feedbackNote" TEXT,
    "userId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_audits_feature_createdAt_idx" ON "ai_usage_audits"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_audits_userId_createdAt_idx" ON "ai_usage_audits"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_audits_projectId_createdAt_idx" ON "ai_usage_audits"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_usage_audits" ADD CONSTRAINT "ai_usage_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_audits" ADD CONSTRAINT "ai_usage_audits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
