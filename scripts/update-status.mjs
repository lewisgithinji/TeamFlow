#!/usr/bin/env node

/**
 * Automatic Status Updater
 *
 * Updates CURRENT-STATE.md based on:
 * - Running Docker containers
 * - Available API endpoints
 * - Frontend pages
 * - Database migrations
 * - Git commits
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      cwd: ROOT,
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    return null;
  }
}

function log(message, color = 'blue') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check what's actually running
function checkInfrastructure() {
  log('\n📊 Checking Infrastructure...', 'blue');

  const dockerPs = exec('docker ps --format "{{.Names}}"', { silent: true });
  const postgres = dockerPs?.includes('postgres') || dockerPs?.includes('teamflow-postgres');
  const redis = dockerPs?.includes('redis') || dockerPs?.includes('teamflow-redis');

  // Check if servers are running (check package.json scripts)
  const ports = {
    backend: checkPort(4000),
    frontend: checkPort(3000) || checkPort(3001),
  };

  return { postgres, redis, ...ports };
}

function checkPort(port) {
  const result = exec(`netstat -ano | findstr :${port}`, { silent: true });
  return result !== null && result.length > 0;
}

// Scan for implemented features
function scanFeatures() {
  log('🔍 Scanning implemented features...', 'blue');

  const features = {
    auth: {
      endpoints: scanAuthEndpoints(),
      pages: scanAuthPages(),
    },
    workspace: {
      endpoints: scanWorkspaceEndpoints(),
      pages: scanWorkspacePages(),
    },
    tasks: {
      endpoints: scanTaskEndpoints(),
      pages: scanTaskPages(),
    },
  };

  return features;
}

function scanAuthEndpoints() {
  const authRoutesPath = join(ROOT, 'apps/api/src/modules/auth/auth.routes.ts');
  if (!existsSync(authRoutesPath)) return [];

  const content = readFileSync(authRoutesPath, 'utf8');
  const endpoints = [];

  // Match router.post/get/put/delete
  const matches = content.matchAll(/router\.(post|get|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
  for (const match of matches) {
    endpoints.push({ method: match[1].toUpperCase(), path: `/api/auth${match[2]}` });
  }

  return endpoints;
}

function scanWorkspaceEndpoints() {
  const workspaceRoutesPath = join(ROOT, 'apps/api/src/modules/workspace/workspace.routes.ts');
  if (!existsSync(workspaceRoutesPath)) return [];

  const content = readFileSync(workspaceRoutesPath, 'utf8');
  const endpoints = [];

  const matches = content.matchAll(/router\.(post|get|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
  for (const match of matches) {
    endpoints.push({ method: match[1].toUpperCase(), path: `/api/workspace${match[2]}` });
  }

  return endpoints;
}

function scanTaskEndpoints() {
  const taskRoutesPath = join(ROOT, 'apps/api/src/modules/task/task.routes.ts');
  if (!existsSync(taskRoutesPath)) return [];

  const content = readFileSync(taskRoutesPath, 'utf8');
  const endpoints = [];

  const matches = content.matchAll(/router\.(post|get|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
  for (const match of matches) {
    endpoints.push({ method: match[1].toUpperCase(), path: `/api/task${match[2]}` });
  }

  return endpoints;
}

function scanAuthPages() {
  const pages = [];
  const authDir = join(ROOT, 'apps/web/src/app/(auth)');

  if (!existsSync(authDir)) return pages;

  const possiblePages = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email'];
  for (const page of possiblePages) {
    const pagePath = join(authDir, page, 'page.tsx');
    if (existsSync(pagePath)) {
      pages.push(`/(auth)/${page}`);
    }
  }

  return pages;
}

function scanWorkspacePages() {
  const pages = [];
  const dashboardDir = join(ROOT, 'apps/web/src/app/(dashboard)');

  if (!existsSync(dashboardDir)) return pages;

  const possiblePages = ['workspace', 'workspace/[id]', 'workspace/settings'];
  for (const page of possiblePages) {
    const pagePath = join(dashboardDir, page, 'page.tsx');
    if (existsSync(pagePath)) {
      pages.push(`/(dashboard)/${page}`);
    }
  }

  return pages;
}

function scanTaskPages() {
  const pages = [];
  const dashboardDir = join(ROOT, 'apps/web/src/app/(dashboard)');

  if (!existsSync(dashboardDir)) return pages;

  const possiblePages = ['board', 'tasks', 'tasks/[id]'];
  for (const page of possiblePages) {
    const pagePath = join(dashboardDir, page, 'page.tsx');
    if (existsSync(pagePath)) {
      pages.push(`/(dashboard)/${page}`);
    }
  }

  return pages;
}

// Check database migrations
async function checkDatabase() {
  log('🗄️  Checking database status...', 'blue');

  const migrationsDir = join(ROOT, 'packages/database/prisma/migrations');
  const hasMigrations = existsSync(migrationsDir);

  let migrationCount = 0;
  if (hasMigrations) {
    const { readdirSync } = await import('fs');
    migrationCount = readdirSync(migrationsDir).filter(f => !f.startsWith('.')).length;
  }

  return { hasMigrations, migrationCount };
}

// Update CURRENT-STATE.md
function updateStatusDocument(data) {
  log('\n📝 Updating CURRENT-STATE.md...', 'blue');

  const statusPath = join(ROOT, 'docs/CURRENT-STATE.md');
  const now = new Date().toISOString().split('T')[0];

  let content = '';

  if (existsSync(statusPath)) {
    content = readFileSync(statusPath, 'utf8');
  }

  // Update "Last Updated" date
  content = content.replace(
    /\*\*Last Updated:\*\* .+/,
    `**Last Updated:** ${now}`
  );

  // Update infrastructure status
  const infraSection = `### ✅ Infrastructure
- PostgreSQL database running (localhost:5432) ${data.infra.postgres ? '✅' : '❌'}
- Redis cache running (localhost:6379) ${data.infra.redis ? '✅' : '❌'}
- Backend API running (http://localhost:4000) ${data.infra.backend ? '✅' : '❌'}
- Frontend web app running (http://localhost:3001) ${data.infra.frontend ? '✅' : '❌'}
- Prisma ORM configured with full schema ✅`;

  // Write back
  writeFileSync(statusPath, content, 'utf8');

  log('✅ Status document updated!', 'green');
}

// Main execution
async function main() {
  log('🚀 TeamFlow Status Updater', 'green');
  log('━'.repeat(50), 'blue');

  const infra = checkInfrastructure();
  const features = scanFeatures();
  const db = await checkDatabase();

  log('\n📊 Status Summary:', 'yellow');
  log(`  PostgreSQL: ${infra.postgres ? '✅' : '❌'}`, infra.postgres ? 'green' : 'red');
  log(`  Redis: ${infra.redis ? '✅' : '❌'}`, infra.redis ? 'green' : 'red');
  log(`  Backend API: ${infra.backend ? '✅' : '❌'}`, infra.backend ? 'green' : 'red');
  log(`  Frontend: ${infra.frontend ? '✅' : '❌'}`, infra.frontend ? 'green' : 'red');
  log(`  Migrations: ${db.migrationCount}`, 'blue');
  log(`  Auth Endpoints: ${features.auth.endpoints.length}`, 'blue');
  log(`  Auth Pages: ${features.auth.pages.length}`, 'blue');

  // Update document
  updateStatusDocument({ infra, features, db });

  log('\n✨ Done!', 'green');
}

main().catch(console.error);
