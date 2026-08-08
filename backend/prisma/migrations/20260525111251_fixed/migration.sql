/*
  Warnings:

  - You are about to drop the column `ProductType` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "ProductType",
ADD COLUMN     "productType" TEXT;
