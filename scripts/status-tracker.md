# 📊 TeamFlow Status Tracker

## 🎯 Purpose

Automatically track and update project status in `docs/CURRENT-STATE.md` after completing features.

## 🚀 Quick Start

### Manual Update (Run Anytime)
```bash
pnpm status:update
```

### Automatic Updates

The status will auto-update in these scenarios:

1. **After Git Pull/Merge** - Post-merge hook
2. **Manual Trigger** - Run `pnpm status:update`
3. **After Major Features** - Run manually

## 📝 What Gets Tracked

### ✅ Infrastructure
- PostgreSQL status (running/stopped)
- Redis status (running/stopped)
- Backend API (port 4000)
- Frontend Web (port 3000/3001)
- Database migrations count

### ✅ Features
- **Auth**: Endpoints + Pages (login, register, etc.)
- **Workspace**: Endpoints + Pages
- **Tasks**: Endpoints + Pages

### ✅ Files Scanned
- `apps/api/src/modules/*/routes.ts` - Backend endpoints
- `apps/web/src/app/**` - Frontend pages
- `packages/database/prisma/migrations` - DB migrations

## 📖 Usage Examples

### After Completing a Feature
```bash
# You just finished building workspace management
git add .
git commit -m "feat: add workspace management"

# Update status to reflect new feature
pnpm status:update

# Commit the updated status
git add docs/CURRENT-STATE.md
git commit -m "docs: update status - workspace management complete"
```

### Check Current Status
```bash
# Run the updater to see what's detected
pnpm status:update

# The script will show:
# ✅ PostgreSQL: Running
# ✅ Redis: Running
# ✅ Backend API: Running
# ✅ Frontend: Running
# 📊 Migrations: 5
# 📊 Auth Endpoints: 3
# 📊 Auth Pages: 4
```

## 🔧 Configuration

### Modify What Gets Tracked

Edit `scripts/update-status.mjs`:

```javascript
// Add new feature scanners
function scanNewFeatureEndpoints() {
  const routesPath = join(ROOT, 'apps/api/src/modules/newfeature/routes.ts');
  // ... scanning logic
}
```

### Customize Status Document Format

Edit the `updateStatusDocument()` function to change how the document is updated.

## 🎨 How It Works

1. **Scan Infrastructure** - Check Docker containers and running ports
2. **Scan Codebase** - Find implemented endpoints and pages
3. **Check Database** - Count migrations
4. **Update Document** - Write to `docs/CURRENT-STATE.md`
5. **Report** - Show summary in terminal

## 🔄 Auto-Update Workflow

### Recommended Workflow

```bash
# 1. Build a feature
# ... write code ...

# 2. Commit your changes
git add .
git commit -m "feat: add email verification"

# 3. Update status document
pnpm status:update

# 4. Review the changes
git diff docs/CURRENT-STATE.md

# 5. Commit status update
git add docs/CURRENT-STATE.md
git commit -m "docs: update status - email verification complete"

# 6. Push
git push
```

### Alternative: Auto-commit Status

Add to `.husky/pre-commit`:
```bash
# Auto-update status before committing
pnpm status:update
git add docs/CURRENT-STATE.md
```

## 📊 Status Indicators

- ✅ = Working/Implemented
- ❌ = Not working/Not implemented
- ⏳ = In progress
- 🚧 = Partial implementation

## 🐛 Troubleshooting

### Script fails to run
```bash
# Make sure script is executable
chmod +x scripts/update-status.mjs

# Or run directly with node
node scripts/update-status.mjs
```

### Status not updating
```bash
# Check if file exists
ls docs/CURRENT-STATE.md

# Check if git hooks are installed
ls .husky/post-merge

# Reinstall hooks
pnpm prepare
```

### False positives
The script checks:
- Docker: `docker ps` output
- Ports: `netstat` for listening ports
- Files: Actual file existence

If something shows as "running" but isn't:
1. Check if process is actually running
2. Stop conflicting processes
3. Update the script logic

## 🎯 Best Practices

### ✅ DO
- Run `pnpm status:update` after completing major features
- Review the diff before committing
- Keep CURRENT-STATE.md up to date
- Use it as source of truth for what's implemented

### ❌ DON'T
- Don't manually edit CURRENT-STATE.md (let script handle it)
- Don't run on every small change (too noisy)
- Don't commit without reviewing the changes
- Don't use for tracking bugs (use GitHub Issues)

## 🔗 Related Files

- `docs/CURRENT-STATE.md` - The status document
- `scripts/update-status.mjs` - The updater script
- `.husky/post-merge` - Auto-update hook
- `package.json` - NPM scripts

## 📚 Further Customization

### Add More Sections

Edit `CURRENT-STATE.md` template in the script:

```javascript
const newSection = `### ✅ Email Service
- Resend configured: ${hasResend ? '✅' : '❌'}
- Verification emails: ${hasVerification ? '✅' : '❌'}`;
```

### Integrate with CI/CD

```yaml
# .github/workflows/update-status.yml
name: Update Status
on:
  push:
    branches: [main]
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm status:update
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "docs: auto-update status"
          file_pattern: docs/CURRENT-STATE.md
```

---

**Questions?** Check the script source code or ask Claude Code for help!
