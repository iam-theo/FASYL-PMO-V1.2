/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `WorkflowStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `industry` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectManagerEmail` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkflowStatus_new" AS ENUM ('UNASSIGNED', 'LOCKED', 'OPEN', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED');
ALTER TABLE "Project" ALTER COLUMN "workflowStatus" DROP DEFAULT;
ALTER TABLE "ProjectStage" ALTER COLUMN "workflowStatus" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "workflowStatus" TYPE "WorkflowStatus_new" USING ("workflowStatus"::text::"WorkflowStatus_new");
ALTER TABLE "ProjectStage" ALTER COLUMN "workflowStatus" TYPE "WorkflowStatus_new" USING ("workflowStatus"::text::"WorkflowStatus_new");
ALTER TYPE "WorkflowStatus" RENAME TO "WorkflowStatus_old";
ALTER TYPE "WorkflowStatus_new" RENAME TO "WorkflowStatus";
DROP TYPE "WorkflowStatus_old";
ALTER TABLE "Project" ALTER COLUMN "workflowStatus" SET DEFAULT 'UNASSIGNED';
ALTER TABLE "ProjectStage" ALTER COLUMN "workflowStatus" SET DEFAULT 'LOCKED';
COMMIT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "industry",
DROP COLUMN "projectManagerEmail",
ADD COLUMN     "ProductType" TEXT,
ADD COLUMN     "amcPercentage" DOUBLE PRECISION,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "commencementDate" TIMESTAMP(3),
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "milestones" JSONB,
ADD COLUMN     "pmoAddress" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "purchaseOrderDate" TIMESTAMP(3),
ADD COLUMN     "resources" JSONB,
ADD COLUMN     "saleTypes" TEXT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "workflowStatus" SET DEFAULT 'UNASSIGNED',
ALTER COLUMN "currentStageOrder" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Project_externalId_key" ON "Project"("externalId");
