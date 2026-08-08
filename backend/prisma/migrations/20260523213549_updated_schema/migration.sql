/*
  Warnings:

  - The values [NOT_SUBMITTED] on the enum `ApprovalStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `submittedBy` column on the `ProjectStage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `submittedBy` column on the `project_approvals` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStatus_new" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');
ALTER TABLE "project_approvals" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "project_approvals" ALTER COLUMN "status" TYPE "ApprovalStatus_new" USING ("status"::text::"ApprovalStatus_new");
ALTER TYPE "ApprovalStatus" RENAME TO "ApprovalStatus_old";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";
DROP TYPE "ApprovalStatus_old";
ALTER TABLE "project_approvals" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "ProjectStage" DROP COLUMN "submittedBy",
ADD COLUMN     "submittedBy" INTEGER;

-- AlterTable
ALTER TABLE "project_approvals" DROP COLUMN "submittedBy",
ADD COLUMN     "submittedBy" INTEGER;
