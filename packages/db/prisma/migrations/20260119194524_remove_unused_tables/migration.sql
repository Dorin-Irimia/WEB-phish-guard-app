/*
  Warnings:

  - You are about to drop the `scan_activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "scan_activity" DROP CONSTRAINT "scan_activity_userId_fkey";

-- DropForeignKey
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_userId_fkey";

-- DropTable
DROP TABLE "scan_activity";

-- DropTable
DROP TABLE "subscription";
