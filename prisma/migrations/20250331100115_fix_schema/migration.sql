/*
  Warnings:

  - You are about to drop the column `userEmail` on the `BrandAccess` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,brandId]` on the table `BrandAccess` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `BrandAccess` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BrandAccess" DROP CONSTRAINT "BrandAccess_brandId_fkey";

-- DropForeignKey
ALTER TABLE "BrandAccess" DROP CONSTRAINT "BrandAccess_userEmail_fkey";

-- DropIndex
DROP INDEX "BrandAccess_userEmail_brandId_key";

-- DropIndex
DROP INDEX "BrandAccess_userEmail_idx";

-- AlterTable
ALTER TABLE "BrandAccess" DROP COLUMN "userEmail",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BrandAccess_userId_idx" ON "BrandAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandAccess_userId_brandId_key" ON "BrandAccess"("userId", "brandId");

-- AddForeignKey
ALTER TABLE "BrandAccess" ADD CONSTRAINT "BrandAccess_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("brandId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAccess" ADD CONSTRAINT "BrandAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
