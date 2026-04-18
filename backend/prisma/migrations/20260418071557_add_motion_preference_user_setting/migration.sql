-- CreateEnum
CREATE TYPE "MotionPreference" AS ENUM ('SYSTEM', 'ON', 'OFF');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "motionPreference" "MotionPreference" NOT NULL DEFAULT 'SYSTEM';
