-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('IDEA', 'VALIDATING', 'BUILDING', 'PROTOTYPE', 'DEPLOYED', 'MAINTAINED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskState" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'PROJECT';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "githubLogin" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'IDEA',
    "githubRepo" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "problemId" TEXT,
    "communityId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'open',
    "dueOn" TIMESTAMP(3),
    "ordinal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "state" "TaskState" NOT NULL DEFAULT 'OPEN',
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isGoodFirst" BOOLEAN NOT NULL DEFAULT false,
    "githubUpdatedAt" TIMESTAMP(3),
    "completionAwarded" BOOLEAN NOT NULL DEFAULT false,
    "milestoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_slug_idx" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_githubRepo_idx" ON "Project"("githubRepo");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "RoadmapMilestone_projectId_idx" ON "RoadmapMilestone"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapMilestone_projectId_githubId_key" ON "RoadmapMilestone"("projectId", "githubId");

-- CreateIndex
CREATE INDEX "RoadmapTask_projectId_idx" ON "RoadmapTask"("projectId");

-- CreateIndex
CREATE INDEX "RoadmapTask_milestoneId_idx" ON "RoadmapTask"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapTask_projectId_githubNumber_key" ON "RoadmapTask"("projectId", "githubNumber");

-- CreateIndex
CREATE INDEX "RoadmapDependency_taskId_idx" ON "RoadmapDependency"("taskId");

-- CreateIndex
CREATE INDEX "RoadmapDependency_dependsOnId_idx" ON "RoadmapDependency"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapDependency_taskId_dependsOnId_key" ON "RoadmapDependency"("taskId", "dependsOnId");

-- CreateIndex
CREATE INDEX "Profile_githubLogin_idx" ON "Profile"("githubLogin");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTask" ADD CONSTRAINT "RoadmapTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTask" ADD CONSTRAINT "RoadmapTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "RoadmapMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapDependency" ADD CONSTRAINT "RoadmapDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RoadmapTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapDependency" ADD CONSTRAINT "RoadmapDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "RoadmapTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
