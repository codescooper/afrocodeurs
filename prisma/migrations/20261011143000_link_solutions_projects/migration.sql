ALTER TABLE "Project" ADD COLUMN "solutionId" TEXT;

CREATE INDEX "Project_solutionId_idx" ON "Project"("solutionId");

ALTER TABLE "Project"
ADD CONSTRAINT "Project_solutionId_fkey"
FOREIGN KEY ("solutionId") REFERENCES "Solution"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
