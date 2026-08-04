-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "generatedAt" TIMESTAMP(3);
