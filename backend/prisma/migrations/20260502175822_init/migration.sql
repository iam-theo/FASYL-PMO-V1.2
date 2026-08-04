-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HEADOFOPS', 'PROJECTMANAGER', 'STAFF');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "industry" TEXT,
    "productName" TEXT,
    "projectManager" TEXT,
    "salesId" TEXT,
    "pmoId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'stage_1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage2ClientEngagement" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "rfpReviewed" BOOLEAN NOT NULL DEFAULT false,
    "rfpDate" TIMESTAMP(3),
    "technicalAssessment" BOOLEAN NOT NULL DEFAULT false,
    "proposalApproved" BOOLEAN NOT NULL DEFAULT false,
    "proposalSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "awardReceived" BOOLEAN NOT NULL DEFAULT false,
    "termsAgreed" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage2ClientEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage3Initiation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "awardLetterOnFile" BOOLEAN NOT NULL DEFAULT false,
    "invoiceIssued" BOOLEAN NOT NULL DEFAULT false,
    "signedScopeDoc" BOOLEAN NOT NULL DEFAULT false,
    "paymentReceived" BOOLEAN NOT NULL DEFAULT false,
    "projectCode" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage3Initiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage4Planning" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "charterSigned" BOOLEAN NOT NULL DEFAULT false,
    "projectPlanReady" BOOLEAN NOT NULL DEFAULT false,
    "riskDefined" BOOLEAN NOT NULL DEFAULT false,
    "kickoffHeld" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage4Planning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage5Execution" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT false,
    "milestonesMet" BOOLEAN NOT NULL DEFAULT false,
    "issueLogActive" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage5Execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage6UAT" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "uatStarted" BOOLEAN NOT NULL DEFAULT false,
    "defectsResolved" BOOLEAN NOT NULL DEFAULT false,
    "clientSignoff" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage6UAT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage7GoLive" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "readinessComplete" BOOLEAN NOT NULL DEFAULT false,
    "cutoverApproved" BOOLEAN NOT NULL DEFAULT false,
    "productionLive" BOOLEAN NOT NULL DEFAULT false,
    "smokeTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage7GoLive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage8Closure" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "finalReportReady" BOOLEAN NOT NULL DEFAULT false,
    "clientHandoverDone" BOOLEAN NOT NULL DEFAULT false,
    "documentationDone" BOOLEAN NOT NULL DEFAULT false,
    "financialClosure" BOOLEAN NOT NULL DEFAULT false,
    "resourceReleased" BOOLEAN NOT NULL DEFAULT false,
    "lessonsLearned" TEXT,
    "projectScore" INTEGER,
    "closureApproved" BOOLEAN NOT NULL DEFAULT false,
    "closedBy" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage8Closure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Stage2ClientEngagement_projectId_key" ON "Stage2ClientEngagement"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage3Initiation_projectId_key" ON "Stage3Initiation"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage4Planning_projectId_key" ON "Stage4Planning"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage5Execution_projectId_key" ON "Stage5Execution"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage6UAT_projectId_key" ON "Stage6UAT"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage7GoLive_projectId_key" ON "Stage7GoLive"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage8Closure_projectId_key" ON "Stage8Closure"("projectId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_pmoId_fkey" FOREIGN KEY ("pmoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage2ClientEngagement" ADD CONSTRAINT "Stage2ClientEngagement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage3Initiation" ADD CONSTRAINT "Stage3Initiation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage4Planning" ADD CONSTRAINT "Stage4Planning_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage5Execution" ADD CONSTRAINT "Stage5Execution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage6UAT" ADD CONSTRAINT "Stage6UAT_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage7GoLive" ADD CONSTRAINT "Stage7GoLive_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage8Closure" ADD CONSTRAINT "Stage8Closure_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
