-- Enable pgvector — required for the rag_chunks.embedding column below.
-- Prisma manages every column except the Unsupported `embedding` vector, which
-- is added (with its HNSW index) by hand at the end of this migration.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "RagDocumentSource" AS ENUM ('UPLOAD', 'TEXT', 'URL');

-- CreateEnum
CREATE TYPE "RagDocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED');

-- CreateEnum
CREATE TYPE "RagAnswerStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "RagDocumentSource" NOT NULL DEFAULT 'UPLOAD',
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "status" "RagDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "clientId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_answers" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "draftAnswer" TEXT NOT NULL,
    "citedChunkIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "RagAnswerStatus" NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
    "askedById" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_documents_clientId_status_idx" ON "rag_documents"("clientId", "status");

-- CreateIndex
CREATE INDEX "rag_chunks_clientId_idx" ON "rag_chunks"("clientId");

-- CreateIndex
CREATE INDEX "rag_chunks_documentId_idx" ON "rag_chunks"("documentId");

-- CreateIndex
CREATE INDEX "rag_answers_clientId_status_idx" ON "rag_answers"("clientId", "status");

-- CreateIndex
CREATE INDEX "rag_answers_askedById_createdAt_idx" ON "rag_answers"("askedById", "createdAt");

-- AddForeignKey
ALTER TABLE "rag_documents" ADD CONSTRAINT "rag_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_documents" ADD CONSTRAINT "rag_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_answers" ADD CONSTRAINT "rag_answers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_answers" ADD CONSTRAINT "rag_answers_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_answers" ADD CONSTRAINT "rag_answers_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- pgvector column + index (Prisma `Unsupported("vector(1024)")` — Voyage voyage-3 = 1024 dims).
-- Queried via $queryRaw with vector_cosine_ops; HNSW gives fast approximate ANN search.
ALTER TABLE "rag_chunks" ADD COLUMN "embedding" vector(1024);

-- CreateIndex
CREATE INDEX "rag_chunks_embedding_idx" ON "rag_chunks" USING hnsw ("embedding" vector_cosine_ops);
