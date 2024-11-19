/*
  Warnings:

  - A unique constraint covering the columns `[userId,challengeId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Application_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_challengeId_key" ON "Application"("userId", "challengeId");
