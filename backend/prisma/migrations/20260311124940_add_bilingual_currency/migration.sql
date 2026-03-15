/*
  Warnings:

  - The `currency` column on the `invoices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('VI', 'EN');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('VND', 'USD');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "totalUsd" DECIMAL(15,2),
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'VND';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "budgetUsd" DECIMAL(15,2),
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'VND';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" "Language" NOT NULL DEFAULT 'VI';
