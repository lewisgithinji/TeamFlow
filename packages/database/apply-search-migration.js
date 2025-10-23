const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Applying full-text search migration...');

    // Execute statements one by one
    const statements = [
      // 1. Create pg_trgm extension
      `CREATE EXTENSION IF NOT EXISTS pg_trgm`,

      // 2. Add search_vector column
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "search_vector" tsvector`,

      // 3. Create GIN index
      `CREATE INDEX IF NOT EXISTS "task_search_idx" ON "tasks" USING GIN("search_vector")`,

      // 4. Create function
      `CREATE OR REPLACE FUNCTION update_task_search_vector()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.search_vector :=
           setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
           setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql`,

      // 5. Create trigger
      `DROP TRIGGER IF EXISTS task_search_vector_update ON "tasks"`,
      `CREATE TRIGGER task_search_vector_update
       BEFORE INSERT OR UPDATE ON "tasks"
       FOR EACH ROW
       EXECUTE FUNCTION update_task_search_vector()`,
    ];

    for (let i = 0; i < statements.length; i++) {
      try {
        await prisma.$executeRawUnsafe(statements[i]);
        console.log(`✅ Step ${i + 1}/${statements.length} executed`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⏭️  Step ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    // Update existing tasks
    console.log('🔄 Updating existing tasks with search vectors...');
    await prisma.$executeRawUnsafe(`
      UPDATE "tasks" SET "search_vector" =
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
      WHERE "search_vector" IS NULL
    `);

    console.log('✅ Full-text search migration applied successfully!');
    console.log('\n📊 Testing search functionality...');

    // Test the search_vector column
    const taskCount = await prisma.task.count();
    console.log(`   Found ${taskCount} tasks in database`);

    if (taskCount > 0) {
      // Test full-text search query
      const searchResults = await prisma.$queryRaw`
        SELECT id, title, description
        FROM tasks
        WHERE search_vector @@ plainto_tsquery('english', 'test')
        LIMIT 5
      `;
      console.log(`   Full-text search test: Found ${searchResults.length} matching tasks`);
    }

    console.log('\n🎉 Search filters setup complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
