-- CreateExtension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AddColumn: search_vector to tasks table
ALTER TABLE "tasks" ADD COLUMN "search_vector" tsvector;

-- CreateIndex: GIN index for full-text search on tasks
CREATE INDEX "task_search_idx" ON "tasks" USING GIN("search_vector");

-- CreateFunction: Update search_vector automatically
CREATE OR REPLACE FUNCTION update_task_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger: Auto-update search_vector on INSERT or UPDATE
CREATE TRIGGER task_search_vector_update
BEFORE INSERT OR UPDATE ON "tasks"
FOR EACH ROW
EXECUTE FUNCTION update_task_search_vector();

-- CreateTable: SavedFilter
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SavedFilterTask
CREATE TABLE "saved_filter_tasks" (
    "id" TEXT NOT NULL,
    "filterId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_filter_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_filters_workspaceId_isPublic_idx" ON "saved_filters"("workspaceId", "isPublic");

-- CreateIndex
CREATE INDEX "saved_filters_createdBy_idx" ON "saved_filters"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "saved_filter_tasks_filterId_taskId_key" ON "saved_filter_tasks"("filterId", "taskId");

-- CreateIndex
CREATE INDEX "saved_filter_tasks_filterId_idx" ON "saved_filter_tasks"("filterId");

-- CreateIndex
CREATE INDEX "saved_filter_tasks_taskId_idx" ON "saved_filter_tasks"("taskId");

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filter_tasks" ADD CONSTRAINT "saved_filter_tasks_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "saved_filters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filter_tasks" ADD CONSTRAINT "saved_filter_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update existing tasks with search vectors
UPDATE "tasks" SET "search_vector" =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE "search_vector" IS NULL;
