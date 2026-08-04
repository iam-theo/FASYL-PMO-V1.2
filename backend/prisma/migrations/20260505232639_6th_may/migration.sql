/*
  Warnings:

  - You are about to drop the `ProjectApproval` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectApproval" DROP CONSTRAINT "ProjectApproval_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "ProjectApproval" DROP CONSTRAINT "ProjectApproval_projectId_fkey";

-- DropTable
DROP TABLE "ProjectApproval";

-- CreateTable
CREATE TABLE "project_approvals" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stageModel" TEXT NOT NULL,

    CONSTRAINT "ProjectApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectApproval_projectId_stage_idx" ON "project_approvals"("projectId", "stage");

-- AddForeignKey
ALTER TABLE "project_approvals" ADD CONSTRAINT "ProjectApproval_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_approvals" ADD CONSTRAINT "ProjectApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
