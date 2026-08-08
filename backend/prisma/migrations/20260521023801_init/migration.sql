/*
  Warnings:

  - You are about to drop the `Stage1ClientIdentification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage2ClientEngagement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage3Initiation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage4Planning` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage5Execution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage6UAT` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage7GoLive` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage8Closure` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Stage1ClientIdentification" DROP CONSTRAINT "Stage1ClientIdentification_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage2ClientEngagement" DROP CONSTRAINT "Stage2ClientEngagement_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage3Initiation" DROP CONSTRAINT "Stage3Initiation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage4Planning" DROP CONSTRAINT "Stage4Planning_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage5Execution" DROP CONSTRAINT "Stage5Execution_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage6UAT" DROP CONSTRAINT "Stage6UAT_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage7GoLive" DROP CONSTRAINT "Stage7GoLive_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Stage8Closure" DROP CONSTRAINT "Stage8Closure_projectId_fkey";

-- AlterTable
ALTER TABLE "project_approvals" ADD COLUMN     "rejectedBy" INTEGER,
ADD COLUMN     "submittedBy" INTEGER;

-- DropTable
DROP TABLE "Stage1ClientIdentification";

-- DropTable
DROP TABLE "Stage2ClientEngagement";

-- DropTable
DROP TABLE "Stage3Initiation";

-- DropTable
DROP TABLE "Stage4Planning";

-- DropTable
DROP TABLE "Stage5Execution";

-- DropTable
DROP TABLE "Stage6UAT";

-- DropTable
DROP TABLE "Stage7GoLive";

-- DropTable
DROP TABLE "Stage8Closure";

-- CreateTable
CREATE TABLE "ProjectStage" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stageIndex" INTEGER NOT NULL,
    "stageName" TEXT NOT NULL,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED',
    "checklist" JSONB NOT NULL,
    "requiredDocs" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "escalatedBy" INTEGER,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStage_projectId_stageIndex_key" ON "ProjectStage"("projectId", "stageIndex");

-- AddForeignKey
ALTER TABLE "ProjectStage" ADD CONSTRAINT "ProjectStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
