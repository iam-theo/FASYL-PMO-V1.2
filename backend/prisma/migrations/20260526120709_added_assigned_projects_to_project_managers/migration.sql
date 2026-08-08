/*
  Warnings:

  - You are about to drop the column `pmoId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectManager` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_pmoId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "pmoId",
DROP COLUMN "projectManager",
ADD COLUMN     "projectManagerEmail" TEXT,
ADD COLUMN     "projectManagerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
