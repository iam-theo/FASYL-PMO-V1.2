/*
  Warnings:

  - Added the required column `stageName` to the `Stage2ClientEngagement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `Stage3Initiation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `Stage4Planning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `Stage5Execution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `Stage6UAT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `Stage7GoLive` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `Stage8Closure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'stage1';

-- AlterTable
ALTER TABLE "Stage2ClientEngagement" ADD COLUMN     "stageName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stage3Initiation" ADD COLUMN     "stageName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stage4Planning" ADD COLUMN     "stageName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stage5Execution" ADD COLUMN     "stageName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stage6UAT" ADD COLUMN     "stageName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stage7GoLive" ADD COLUMN     "stageName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stage8Closure" ADD COLUMN     "stageName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Stage1ClientIdentification" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stageName" TEXT NOT NULL,
    "clientNameConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "industryClass" BOOLEAN NOT NULL DEFAULT false,
    "contactIdentified" BOOLEAN NOT NULL DEFAULT false,
    "initialNeedsDocumented" BOOLEAN NOT NULL DEFAULT false,
    "confidentialitySigned" BOOLEAN NOT NULL DEFAULT false,
    "screeningCompleted" BOOLEAN NOT NULL DEFAULT false,
    "KYCAMLScreeningCompleted" BOOLEAN NOT NULL DEFAULT false,
    "opportunityLogged" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "escalatedBy" INTEGER,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" INTEGER,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" INTEGER,

    CONSTRAINT "Stage1ClientIdentification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stage1ClientIdentification_projectId_key" ON "Stage1ClientIdentification"("projectId");

-- AddForeignKey
ALTER TABLE "Stage1ClientIdentification" ADD CONSTRAINT "Stage1ClientIdentification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
