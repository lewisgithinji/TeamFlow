# 🔍 Where to Find the Search Feature

## 📍 Location: Top Navigation Bar

The **Global Search Bar** is located in the **top navigation bar** of your dashboard, between the workspace switcher and your user profile.

---

## 🎯 Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TeamFlow  [Workspace ▼]  🔍 [Search tasks, projects...]  Welcome, User 🔔 Logout │
└─────────────────────────────────────────────────────────────────────┘
    (1)         (2)                    (3)                     (4)  (5)  (6)
```

1. **TeamFlow Logo** - Left side
2. **Workspace Switcher** - Select your workspace
3. **🔍 Search Bar** - ⭐ **THIS IS IT!** ⭐
4. **Welcome Message** - Your name
5. **Notifications Bell** - 🔔
6. **Logout Button** - Right side

---

## ✅ How to See the Search Bar

### Step 1: Log In
- Go to http://localhost:3002
- Log in with your credentials

### Step 2: Select a Workspace
- The search bar **only appears when a workspace is selected**
- Use the workspace switcher (dropdown next to TeamFlow logo)
- Select or create a workspace

### Step 3: Look for the Search Bar
- It's centered in the top navigation
- Has a magnifying glass 🔍 icon
- Placeholder text: "Search tasks, projects, or use filters..."

---

## 🔍 Using the Search Feature

### Quick Search (From Any Page)
1. **Click the search bar** in the top navigation
2. **Type 2+ characters** (e.g., "bug", "feature", "task")
3. **See suggestions** appear instantly
4. **Press Enter** or click a suggestion

### Advanced Search & Filters
1. **Click the search bar** OR
2. **Navigate directly** to `/{workspaceId}/search`
3. **Click "Filters"** button on the right
4. **Select your filters**:
   - Status (Todo, In Progress, Done, etc.)
   - Priority (Low, Medium, High, Critical)
   - Assignees
   - Labels
   - Due dates
   - Sort options
5. **Click "Apply Filters"**

### Saved Filters
1. **Apply some filters** first
2. **Click "Saved Filters"** button
3. **Click "Save Current"**
4. **Name your filter** and save
5. **Load later** with one click!

---

## 🐛 Troubleshooting

### ❌ "I don't see the search bar!"

**Solution 1: Select a Workspace**
- The search bar only shows when a workspace is active
- Look for the workspace switcher dropdown (next to TeamFlow logo)
- Select or create a workspace

**Solution 2: Refresh the Page**
```bash
# Press F5 or Ctrl+R in your browser
```

**Solution 3: Check if Server is Running**
```bash
# Terminal 1: Check Web Server
cd apps/web
pnpm dev

# Terminal 2: Check API Server
cd apps/api
pnpm dev
```

**Solution 4: Clear Browser Cache**
- Press `Ctrl+Shift+Delete` (Windows/Linux)
- Or `Cmd+Shift+Delete` (Mac)
- Clear cache and reload

---

## 📸 Screenshot Reference

The search bar appears in this exact location:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏢 TeamFlow    [My Workspace ▼]                                  ┃
┃                                                                    ┃
┃         ┌──────────────────────────────────────────────┐         ┃
┃    🔍   │ Search tasks, projects, or use filters...    │         ┃
┃         └──────────────────────────────────────────────┘         ┃
┃                                                                    ┃
┃                            Welcome, John  🔔  [Logout]            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     ↑
     Search bar appears here in the center of the top nav!
```

---

## 🎯 Direct Access URLs

You can also access search directly via URL:

### Option 1: Basic Search
```
http://localhost:3002/{workspaceId}/search
```

### Option 2: Search with Query
```
http://localhost:3002/{workspaceId}/search?q=your-search-term
```

### Option 3: Search with Filters
```
http://localhost:3002/{workspaceId}/search?status=TODO,IN_PROGRESS&priority=HIGH
```

**Replace `{workspaceId}` with your actual workspace ID!**

---

## 💡 Pro Tips

### Tip 1: Keyboard Navigation
- Type in search → suggestions appear
- Use **Arrow keys** to navigate suggestions
- Press **Enter** to search
- Press **Escape** to close dropdown

### Tip 2: Search from Any Page
- The search bar is always available in the top nav
- No need to navigate to a special search page first
- Just click and start typing!

### Tip 3: Combine Filters
- You can combine multiple filters:
  - Status + Priority + Assignee + Labels + Dates
  - All filters work together!

### Tip 4: Share Filtered Views
- Apply filters → Copy browser URL → Share with team
- They'll see the exact same filtered results!

---

## 🚀 Quick Start Checklist

- [ ] Log in to http://localhost:3002
- [ ] Select a workspace (use dropdown next to TeamFlow logo)
- [ ] Look for search bar in top navigation (center)
- [ ] Click the search bar
- [ ] Type 2+ characters
- [ ] See suggestions appear
- [ ] Press Enter to see full results

**If you can complete this checklist, the search feature is working! 🎉**

---

## 📞 Still Can't Find It?

If you've followed all steps and still don't see the search bar:

1. **Check browser console** (F12) for errors
2. **Verify you're on the dashboard page** (not login page)
3. **Confirm a workspace is selected** in the dropdown
4. **Check that both servers are running**:
   ```bash
   # Should see output from both:
   curl http://localhost:3002  # Web server
   curl http://localhost:4000/health  # API server
   ```

---

## 🎉 Success!

Once you see the search bar with the 🔍 icon in your top navigation, you're all set!

**The search feature includes:**
- ✅ Real-time search suggestions
- ✅ Advanced filtering (9+ filter types)
- ✅ Saved filter presets
- ✅ URL-based filter sharing
- ✅ Fast PostgreSQL full-text search

**Happy Searching! 🔍✨**
