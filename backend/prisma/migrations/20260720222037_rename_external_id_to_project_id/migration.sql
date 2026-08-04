-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_projectId_fkey";

ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_projectId_fkey";

ALTER TABLE "Escalation" DROP CONSTRAINT "Escalation_projectId_fkey";

ALTER TABLE "Notification" DROP CONSTRAINT "Notification_projectId_fkey";

ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

ALTER TABLE "ProjectStage" DROP CONSTRAINT "ProjectStage_projectId_fkey";

ALTER TABLE "ProjectTimeline" DROP CONSTRAINT "ProjectTimeline_projectId_fkey";

ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

ALTER TABLE "project_approvals" DROP CONSTRAINT "ProjectApproval_projectId_fkey";

------------------------------------------------------------
-- Rename Project.externalId -> projectId
------------------------------------------------------------

ALTER TABLE "Project"
RENAME COLUMN "externalId" TO "projectId";

------------------------------------------------------------
-- Convert FK columns from INT to TEXT
------------------------------------------------------------

ALTER TABLE "ActivityLog"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "AuditLog"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "Escalation"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "Notification"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "ProjectMember"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "ProjectStage"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "ProjectTimeline"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "Task"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

ALTER TABLE "project_approvals"
ALTER COLUMN "projectId" TYPE TEXT
USING "projectId"::text;

------------------------------------------------------------
-- Migrate existing data
------------------------------------------------------------

UPDATE "ProjectStage" ps
SET "projectId" = p."projectId"
FROM "Project" p
WHERE ps."projectId" = p."id"::text;

UPDATE "project_approvals" pa
SET "projectId" = p."projectId"
FROM "Project" p
WHERE pa."projectId" = p."id"::text;

------------------------------------------------------------
-- Recreate foreign keys
------------------------------------------------------------

ALTER TABLE "ProjectMember"
ADD CONSTRAINT "ProjectMember_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ProjectStage"
ADD CONSTRAINT "ProjectStage_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "project_approvals"
ADD CONSTRAINT "ProjectApproval_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ProjectTimeline"
ADD CONSTRAINT "ProjectTimeline_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Escalation"
ADD CONSTRAINT "Escalation_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ActivityLog"
ADD CONSTRAINT "ActivityLog_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("projectId")
ON DELETE SET NULL
ON UPDATE CASCADE;