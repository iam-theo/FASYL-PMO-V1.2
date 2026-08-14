-- CreateTable
CREATE TABLE "TaskResource" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskResource_resourceId_idx" ON "TaskResource"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskResource_taskId_resourceId_key" ON "TaskResource"("taskId", "resourceId");

-- AddForeignKey
ALTER TABLE "TaskResource" ADD CONSTRAINT "TaskResource_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
