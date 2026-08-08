/*
  Warnings:

  - A unique constraint covering the columns `[projectId,stageOrder]` on the table `ProjectStage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProjectStage_projectId_stageIndex_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStage_projectId_stageOrder_key" ON "ProjectStage"("projectId", "stageOrder");
