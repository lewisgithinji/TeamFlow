# Troubleshooting: Cannot See Workflow Builder in Dashboard

## Problem
User reports they cannot see the workflow builder in the dashboard.

## ✅ What Should You See

### 1. In the Sidebar Navigation
There should be an **"Automations"** link with a lightning bolt (⚡) icon between "Activity" and "Analytics".

### 2. Expected URLs
- **List Page**: `http://localhost:3001/{workspaceId}/automations`
- **Builder Page**: `http://localhost:3001/{workspaceId}/automations/new`
- **Edit Page**: `http://localhost:3001/{workspaceId}/automations/{ruleId}`

## 🔍 Troubleshooting Steps

### Step 1: Check if Servers are Running
```bash
# Check if backend is running on port 4000
curl http://localhost:4000/api/health

# Check if frontend is running on port 3001
curl http://localhost:3001
```

### Step 2: Verify You're Logged In
1. Open browser DevTools (F12)
2. Go to Application → Local Storage → http://localhost:3001
3. Check if `token` exists
4. If not, go to login page: `http://localhost:3001/login`
5. Login with demo credentials:
   - Email: `demo@teamflow.dev`
   - Password: `password123`

### Step 3: Verify Workspace is Loaded
1. Open browser DevTools (F12)
2. Go to Application → Local Storage → http://localhost:3001
3. Check if `currentWorkspaceId` exists
4. If the sidebar shows "Current Workspace" at the bottom, workspace is loaded

### Step 4: Check Sidebar Navigation
1. Look at the left sidebar
2. You should see these menu items:
   - 🏠 Dashboard
   - 📁 Projects
   - ☑️ Tasks
   - 👥 Team
   - 📊 Activity
   - **⚡ Automations** ← This should be visible!
   - 📈 Analytics
   - ⚙️ Settings

### Step 5: Click on Automations Link
1. Click on "Automations" in the sidebar
2. You should be redirected to: `/{workspaceId}/automations`
3. You should see:
   - Page title: "Automations"
   - Description: "Create automated workflows to streamline your team's process"
   - Button: "Create Workflow"
   - Either a list of workflows OR an empty state

### Step 6: Create a New Workflow
1. Click "Create Workflow" button
2. You should be redirected to: `/{workspaceId}/automations/new`
3. You should see:
   - Header with back button
   - Workflow name input (default: "New Workflow")
   - Toolbar with "Add Trigger" and "Add Action" buttons
   - Empty canvas with message: "Start building your workflow"
   - Active/Inactive toggle
   - "Save Workflow" button

## 🐛 Common Issues

### Issue 1: "Automations" Link Not Visible

**Possible Causes:**
1. Workspace not loaded in store
2. React not rendering due to error

**Solution:**
1. Check browser console (F12) for errors
2. Refresh the page (Ctrl+R or Cmd+R)
3. Try logging out and logging back in
4. Check if `currentWorkspace` is null in React DevTools

### Issue 2: 404 Error When Clicking Automations

**Possible Causes:**
1. Route not properly set up
2. Workspace ID is invalid

**Solution:**
1. Check the URL in browser address bar
2. Verify workspace ID exists in URL
3. Check browser console for routing errors
4. Verify files exist:
   - `apps/web/src/app/(dashboard)/[workspaceId]/automations/page.tsx`
   - `apps/web/src/app/(dashboard)/[workspaceId]/automations/[ruleId]/page.tsx`

### Issue 3: Blank Page After Clicking Automations

**Possible Causes:**
1. JavaScript error preventing render
2. API endpoint not responding

**Solution:**
1. Open browser DevTools (F12) → Console tab
2. Look for errors in red
3. Check Network tab for failed API requests
4. Verify backend is running on port 4000
5. Test API endpoint: `curl http://localhost:4000/api/workspaces/{workspaceId}/automation/rules`

### Issue 4: Unauthorized Error

**Possible Causes:**
1. Token expired
2. Not logged in
3. User not member of workspace

**Solution:**
1. Log out and log back in
2. Check token in localStorage (should not be empty)
3. Verify user is member of workspace
4. Check backend logs for authentication errors

## 🔧 Manual Navigation (Bypass Sidebar)

If the sidebar link isn't working, you can navigate directly:

1. **Get your workspace ID:**
   - Open DevTools (F12) → Application → Local Storage
   - Copy the value of `currentWorkspaceId`
   - OR look at any other page URL (Projects, Tasks, etc.)

2. **Navigate directly:**
   - Go to: `http://localhost:3001/{your-workspace-id}/automations`
   - Replace `{your-workspace-id}` with actual workspace ID

**Example:**
```
http://localhost:3001/550e8400-e29b-41d4-a716-446655440000/automations
```

## 📝 Verification Checklist

Use this checklist to verify everything is working:

- [ ] Backend server running on port 4000
- [ ] Frontend server running on port 3001
- [ ] Logged in with valid token
- [ ] Workspace loaded (visible in sidebar footer)
- [ ] "Automations" link visible in sidebar
- [ ] Clicking "Automations" loads the list page
- [ ] "Create Workflow" button visible
- [ ] Clicking "Create Workflow" opens builder
- [ ] Can add trigger nodes
- [ ] Can add action nodes
- [ ] Can configure nodes
- [ ] Can save workflow

## 🆘 Still Not Working?

If you've tried all the above and still can't see the workflow builder:

1. **Check file existence:**
   ```bash
   ls apps/web/src/app/\(dashboard\)/[workspaceId]/automations/
   ```
   Should show: `page.tsx` and `[ruleId]` directory

2. **Restart development servers:**
   ```bash
   # Kill existing servers
   # Windows: taskkill /F /IM node.exe
   # Mac/Linux: killall node

   # Restart
   pnpm dev
   ```

3. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

4. **Check browser console for errors:**
   - Open DevTools (F12) → Console tab
   - Look for any red error messages
   - Share these errors for debugging

## 📸 Expected Screenshots

### 1. Sidebar with Automations Link
```
┌─────────────────────┐
│ 🏠 Dashboard        │
│ 📁 Projects         │
│ ☑️ Tasks            │
│ 👥 Team             │
│ 📊 Activity         │
│ ⚡ Automations      │ ← Should be here!
│ 📈 Analytics        │
│ ⚙️ Settings         │
└─────────────────────┘
```

### 2. Automations List Page
```
┌──────────────────────────────────────────┐
│ Automations                  [+ Create]  │
│ Create automated workflows...            │
├──────────────────────────────────────────┤
│                                          │
│  [Empty State]                           │
│  ⚡                                       │
│  No automations                          │
│  Get started by creating your first...   │
│  [+ Create Workflow]                     │
│                                          │
└──────────────────────────────────────────┘
```

### 3. Workflow Builder
```
┌──────────────────────────────────────────┐
│ [← Back] New Workflow    [✓ Save]       │
├──────────────────────────────────────────┤
│ [+ Add Trigger] [+ Add Action]           │
├──────────────────────────────────────────┤
│                                          │
│         [Empty Canvas]                   │
│                                          │
│              ⚡                          │
│   Start building your workflow           │
│   Click "Add Trigger" to begin           │
│                                          │
└──────────────────────────────────────────┘
```

---

**Last Updated:** 2025-10-14
**Status:** Troubleshooting Guide
