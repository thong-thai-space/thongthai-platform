-- CreateTable
CREATE TABLE "content_overrides" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "locale" "Language" NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_overrides_namespace_locale_key" ON "content_overrides"("namespace", "locale");
