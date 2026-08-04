-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('LOCKED', 'OPEN', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EscalationLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currentStage" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Stage2ClientEngagement" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Stage3Initiation" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED';

-- AlterTable
ALTER TABLE "Stage4Planning" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED';

-- AlterTable
ALTER TABLE "Stage5Execution" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED';

-- AlterTable
ALTER TABLE "Stage6UAT" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED';

-- AlterTable
ALTER TABLE "Stage7GoLive" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED';

-- AlterTable
ALTER TABLE "Stage8Closure" ADD COLUMN     "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'LOCKED';

-- CreateTable
CREATE TABLE "ProjectApproval" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTimeline" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL,
    "level" "EscalationLevel" NOT NULL DEFAULT 'LOW',
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "projectId" INTEGER,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectApproval_projectId_stage_idx" ON "ProjectApproval"("projectId", "stage");

-- CreateIndex
CREATE INDEX "ProjectTimeline_projectId_idx" ON "ProjectTimeline"("projectId");

-- CreateIndex
CREATE INDEX "Escalation_projectId_resolved_idx" ON "Escalation"("projectId", "resolved");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_idx" ON "AuditLog"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectApproval" ADD CONSTRAINT "ProjectApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectApproval" ADD CONSTRAINT "ProjectApproval_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTimeline" ADD CONSTRAINT "ProjectTimeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
