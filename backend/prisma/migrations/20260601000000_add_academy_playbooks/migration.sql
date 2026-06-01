-- CreateEnum
CREATE TYPE "PlaybookStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlaybookAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "playbooks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentMdx" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PlaybookStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbook_assignments" (
    "id" TEXT NOT NULL,
    "status" "PlaybookAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "playbookId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playbook_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playbooks_slug_key" ON "playbooks"("slug");

-- CreateIndex
CREATE INDEX "playbooks_status_publishedAt_idx" ON "playbooks"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "playbook_assignments_clientId_status_idx" ON "playbook_assignments"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "playbook_assignments_playbookId_clientId_key" ON "playbook_assignments"("playbookId", "clientId");

-- AddForeignKey
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_assignments" ADD CONSTRAINT "playbook_assignments_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_assignments" ADD CONSTRAINT "playbook_assignments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_assignments" ADD CONSTRAINT "playbook_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
