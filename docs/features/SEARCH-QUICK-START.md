# Advanced Search & Filters - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Servers

```bash
# Terminal 1: Start the API server
cd apps/api
pnpm dev

# Terminal 2: Start the Web app
cd apps/web
pnpm dev
```

### 2. Access the Application

- Web App: http://localhost:3000
- API: http://localhost:4000

---

## 🔍 Testing Search Features

### Test 1: Global Search Bar

1. Log in to TeamFlow
2. Look for the search bar in the top navigation (between workspace switcher and user menu)
3. Type at least 2 characters (e.g., "bug" or "feature")
4. Watch for real-time suggestions to appear
5. Press Enter to see full search results

**Expected Result**: Search suggestions appear with highlighted matching text

### Test 2: Advanced Filters

1. Click the search bar or navigate to `/{workspaceId}/search`
2. Click the "Filters" button on the right
3. Select multiple statuses (e.g., "Todo" and "In Progress")
4. Select a priority (e.g., "High")
5. Click "Apply Filters"

**Expected Result**: Results update automatically, URL updates with filter parameters

### Test 3: Save Filter Preset

1. Apply some filters (status, priority, etc.)
2. Click "Saved Filters" button
3. Click "Save Current"
4. Enter a name: "My High Priority Tasks"
5. Optionally add description
6. Choose public/private visibility
7. Click "Save Filter"

**Expected Result**: Filter saved successfully, toast notification appears

### Test 4: Load Saved Filter

1. Click "Saved Filters" button
2. See your saved filter in the list
3. Click on the filter name
4. Filters automatically applied

**Expected Result**: Search updates with saved filter criteria

### Test 5: Share Filter URL

1. Apply some filters
2. Click "Saved Filters" button (or save a filter first)
3. Click the Share icon (🔗) next to a saved filter
4. URL copied to clipboard
5. Open new browser tab, paste URL
6. Page loads with filters pre-applied

**Expected Result**: Shareable URL with all filter parameters

### Test 6: Clear Filters

1. Apply multiple filters
2. Open Filter Panel
3. Click "Clear all" button at bottom

**Expected Result**: All filters cleared, search resets

---

## 🧪 API Testing

### Test Search API Directly

```bash
# Get your auth token from localStorage or login response
TOKEN="your-jwt-token-here"
WORKSPACE_ID="your-workspace-id-here"

# Test 1: Basic text search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/search/tasks?q=bug&workspaceId=$WORKSPACE_ID"

# Test 2: Filter by status and priority
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/search/tasks?workspaceId=$WORKSPACE_ID&status=TODO,IN_PROGRESS&priority=HIGH,CRITICAL"

# Test 3: Get search suggestions
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/search/suggestions?q=feat&workspaceId=$WORKSPACE_ID"

# Test 4: Create saved filter
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Priority Tasks",
    "workspaceId": "'$WORKSPACE_ID'",
    "filters": {
      "status": ["TODO", "IN_PROGRESS"],
      "priority": ["HIGH", "CRITICAL"]
    },
    "isPublic": true
  }' \
  "http://localhost:4000/api/search/filters"

# Test 5: Get saved filters
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/search/filters/$WORKSPACE_ID"
```

---

## 📊 Database Verification

### Check Search Infrastructure

```sql
-- Connect to your PostgreSQL database
psql -h localhost -U postgres -d teamflow_dev

-- Verify search_vector column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'search_vector';

-- Check GIN index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tasks' AND indexname = 'task_search_idx';

-- Verify trigger function
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'update_task_search_vector';

-- Test full-text search
SELECT id, title, description,
       ts_rank(search_vector, plainto_tsquery('english', 'bug')) as relevance
FROM tasks
WHERE search_vector @@ plainto_tsquery('english', 'bug')
ORDER BY relevance DESC
LIMIT 10;

-- Check saved filters
SELECT * FROM saved_filters;
```

---

## 🐛 Troubleshooting

### Issue: Search bar not showing
**Solution**: Make sure you have a workspace selected. The search bar only appears when `currentWorkspaceId` is set in the workspace store.

### Issue: No search results
**Solution**:
1. Check that you have tasks in the database
2. Verify the search_vector column is populated: `SELECT COUNT(*) FROM tasks WHERE search_vector IS NOT NULL;`
3. Run the migration script again if needed: `node packages/database/apply-search-migration.js`

### Issue: Suggestions not appearing
**Solution**:
1. Type at least 2 characters
2. Check browser console for API errors
3. Verify API is running on port 4000
4. Check that JWT token is valid

### Issue: Filters not working
**Solution**:
1. Open browser DevTools → Network tab
2. Check the API request includes filter parameters
3. Verify response contains filtered results
4. Check console for React Query errors

### Issue: Saved filters not loading
**Solution**:
1. Check that SavedFilter table exists: `\dt saved_filters` in psql
2. Verify user has permission to view filters
3. Check API logs for authentication errors

---

## 📈 Performance Testing

### Load Testing

```bash
# Install Apache Bench (if not installed)
# Windows: Download from Apache website
# Mac: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Test search endpoint performance
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/search/tasks?q=test&workspaceId=$WORKSPACE_ID"
```

**Expected Results**:
- Response time: < 100ms for most requests
- Throughput: > 100 requests/second
- No errors or timeouts

### Database Query Performance

```sql
-- Analyze search query performance
EXPLAIN ANALYZE
SELECT id, title, description,
       ts_rank(search_vector, plainto_tsquery('english', 'bug')) as relevance
FROM tasks
WHERE search_vector @@ plainto_tsquery('english', 'bug')
ORDER BY relevance DESC
LIMIT 50;
```

**Look for**:
- "Bitmap Index Scan" on task_search_idx
- Execution time < 50ms
- No sequential scans

---

## ✅ Feature Checklist

Use this checklist to verify all features are working:

### Search
- [ ] Global search bar appears in navigation
- [ ] Typing triggers suggestions after 2 characters
- [ ] Suggestions have highlighted matching text
- [ ] Press Enter navigates to search results page
- [ ] Search results display correctly
- [ ] Relevance scores shown for text searches

### Filters
- [ ] Filter panel opens/closes correctly
- [ ] Status filter (multi-select) works
- [ ] Priority filter (multi-select) works
- [ ] Assignee filter with avatars works
- [ ] Label filter with colors works
- [ ] Due date range filter works
- [ ] Sort options work (relevance, date, priority)
- [ ] Active filter count badge shows correct number
- [ ] Clear all filters resets everything

### Saved Filters
- [ ] "Save Current" button works
- [ ] Filter name and description can be entered
- [ ] Public/private toggle works
- [ ] Saved filters list displays correctly
- [ ] Click filter name applies it
- [ ] Share icon copies URL to clipboard
- [ ] Delete button removes owned filters
- [ ] Only owner can delete their filters
- [ ] Public filters visible to all members

### URL Sharing
- [ ] URL updates when filters change
- [ ] Shared URL opens with filters applied
- [ ] Browser back/forward navigation works
- [ ] Bookmarked URLs work correctly
- [ ] All filter types encoded in URL

### Performance
- [ ] Search results load in < 1 second
- [ ] No lag when typing in search bar
- [ ] Filter updates are instantaneous
- [ ] No console errors or warnings
- [ ] Smooth transitions and animations

---

## 🎉 Success Criteria

Your implementation is successful if:

1. ✅ All items in the feature checklist pass
2. ✅ Search returns relevant results in < 1 second
3. ✅ Filters can be combined and work together
4. ✅ Saved filters persist across sessions
5. ✅ Shared URLs work in other browsers/devices
6. ✅ No console errors or warnings
7. ✅ UI is responsive and intuitive
8. ✅ Database queries use GIN index efficiently

---

## 📞 Need Help?

If you encounter issues:

1. Check the main documentation: `docs/features/SEARCH-FILTERS-COMPLETE.md`
2. Review implementation plan: `docs/features/SEARCH-FILTERS-IMPLEMENTATION.md`
3. Check browser console for errors
4. Review API logs for backend issues
5. Verify database schema and migrations

**Happy Searching! 🔍**
