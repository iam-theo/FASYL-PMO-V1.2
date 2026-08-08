/*
  Warnings:

  - You are about to drop the column `currentStage` on the `Project` table. All the data in the column will be lost.
  - Added the required column `stageKey` to the `ProjectStage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageOrder` to the `ProjectStage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "currentStage",
ADD COLUMN     "currentStageOrder" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ProjectStage" ADD COLUMN     "stageKey" TEXT NOT NULL,
ADD COLUMN     "stageOrder" INTEGER NOT NULL;
