#!/bin/bash

# TeamFlow Setup Verification Script

echo "🔍 TeamFlow Architecture Phase Verification"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

check() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} $2"
        FAILED=$((FAILED + 1))
    fi
}

# Check documentation
echo "📚 Documentation:"
test -f docs/architecture/01-system-design.md && check 0 "System design document" || check 1 "System design document"
test -f docs/architecture/02-tech-stack.md && check 0 "Tech stack document" || check 1 "Tech stack document"
test -f docs/architecture/03-directory-structure.md && check 0 "Directory structure document" || check 1 "Directory structure document"
test -f docs/architecture/04-setup-complete.md && check 0 "Setup complete document" || check 1 "Setup complete document"
test -f docs/architecture/05-coding-standards.md && check 0 "Coding standards document" || check 1 "Coding standards document"
test -f docs/architecture/06-standards-summary.md && check 0 "Standards summary" || check 1 "Standards summary"
echo ""

# Check configuration files
echo "⚙️  Configuration Files:"
test -f package.json && check 0 "Root package.json" || check 1 "Root package.json"
test -f turbo.json && check 0 "Turborepo config" || check 1 "Turborepo config"
test -f pnpm-workspace.yaml && check 0 "pnpm workspace" || check 1 "pnpm workspace"
test -f .prettierrc.json && check 0 "Prettier config" || check 1 "Prettier config"
test -f .eslintrc.js && check 0 "Root ESLint config" || check 1 "Root ESLint config"
test -f .commitlintrc.json && check 0 "Commitlint config" || check 1 "Commitlint config"
test -f .lintstagedrc.json && check 0 "Lint-staged config" || check 1 "Lint-staged config"
test -f .editorconfig && check 0 "EditorConfig" || check 1 "EditorConfig"
test -f .gitignore && check 0 "Git ignore" || check 1 "Git ignore"
test -f .env.example && check 0 "Environment template" || check 1 "Environment template"
echo ""

# Check git hooks
echo "🪝 Git Hooks:"
test -f .husky/pre-commit && check 0 "Pre-commit hook" || check 1 "Pre-commit hook"
test -f .husky/commit-msg && check 0 "Commit-msg hook" || check 1 "Commit-msg hook"
echo ""

# Check GitHub files
echo "🐙 GitHub:"
test -f .github/workflows/ci.yml && check 0 "CI workflow" || check 1 "CI workflow"
test -f .github/workflows/deploy-web.yml && check 0 "Deploy web workflow" || check 1 "Deploy web workflow"
test -f .github/workflows/deploy-api.yml && check 0 "Deploy API workflow" || check 1 "Deploy API workflow"
test -f .github/PULL_REQUEST_TEMPLATE.md && check 0 "PR template" || check 1 "PR template"
test -f .github/ISSUE_TEMPLATE/bug_report.md && check 0 "Bug report template" || check 1 "Bug report template"
test -f .github/ISSUE_TEMPLATE/feature_request.md && check 0 "Feature request template" || check 1 "Feature request template"
echo ""

# Check apps
echo "📱 Apps:"
test -d apps/web && check 0 "Frontend app directory" || check 1 "Frontend app directory"
test -d apps/api && check 0 "Backend app directory" || check 1 "Backend app directory"
test -f apps/web/package.json && check 0 "Frontend package.json" || check 1 "Frontend package.json"
test -f apps/api/package.json && check 0 "Backend package.json" || check 1 "Backend package.json"
test -f apps/web/tsconfig.json && check 0 "Frontend TypeScript config" || check 1 "Frontend TypeScript config"
test -f apps/api/tsconfig.json && check 0 "Backend TypeScript config" || check 1 "Backend TypeScript config"
test -f apps/web/.eslintrc.js && check 0 "Frontend ESLint config" || check 1 "Frontend ESLint config"
test -f apps/api/.eslintrc.js && check 0 "Backend ESLint config" || check 1 "Backend ESLint config"
echo ""

# Check packages
echo "📦 Packages:"
test -d packages/ui && check 0 "UI package" || check 1 "UI package"
test -d packages/database && check 0 "Database package" || check 1 "Database package"
test -d packages/validators && check 0 "Validators package" || check 1 "Validators package"
test -d packages/types && check 0 "Types package" || check 1 "Types package"
test -d packages/utils && check 0 "Utils package" || check 1 "Utils package"
test -d packages/typescript-config && check 0 "TypeScript config package" || check 1 "TypeScript config package"
test -d packages/eslint-config && check 0 "ESLint config package" || check 1 "ESLint config package"
echo ""

# Check infrastructure
echo "🐳 Infrastructure:"
test -f infrastructure/docker-compose.yml && check 0 "Docker Compose" || check 1 "Docker Compose"
test -f scripts/setup.sh && check 0 "Setup script" || check 1 "Setup script"
test -f scripts/db-migrate.sh && check 0 "Migration script" || check 1 "Migration script"
echo ""

# Summary
echo "=========================================="
echo "📊 Summary:"
echo -e "   Total checks: ${YELLOW}${TOTAL}${NC}"
echo -e "   Passed: ${GREEN}${PASSED}${NC}"
echo -e "   Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Architecture phase is complete.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the output above.${NC}"
    exit 1
fi
