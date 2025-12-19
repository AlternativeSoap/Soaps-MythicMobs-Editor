# Admin Panel Testing Guide

## ✅ SQL Fix Applied
You've successfully run `QUICK_FIX_POLICIES.sql` which fixed the infinite recursion error.

## 🧪 Testing Steps

### 1. **Test Error Console**
```javascript
// Open browser console (F12) and run:
throw new Error('Test error for admin panel');

// Then:
// 1. Open Admin Panel
// 2. Click "Error Console" tab
// 3. You should see the test error listed
```

**Expected Results:**
- ✅ Error Console tab opens without errors
- ✅ Test error appears in the list
- ✅ Error stats show "1 Total Error"
- ✅ You can filter/search errors
- ✅ Export button works

---

### 2. **Test Permissions**
```javascript
// Check what permissions are loaded:
console.log('Permissions:', window.permissionSystem.PERMISSIONS);
console.log('Current Roles:', window.permissionSystem.DEFAULT_ROLES);
```

**Steps:**
1. Open Admin Panel
2. Click "Permissions" tab
3. Click different roles (Super Admin, Template Admin, Moderator, User)
4. Toggle some permissions
5. Click "Save Changes"
6. Refresh page and reopen Permissions tab

**Expected Results:**
- ✅ Permissions tab opens without errors
- ✅ 4 roles listed (Super Admin, Template Admin, Moderator, User)
- ✅ Checkboxes show for each permission
- ✅ Super Admin checkboxes are disabled (always has all permissions)
- ✅ Changes persist after refresh
- ✅ "Permissions saved successfully!" notification appears

---

### 3. **Test Analytics**
**Steps:**
1. Open Admin Panel
2. Click "Analytics" tab
3. Click "Refresh" button

**Expected Results:**
- ✅ Analytics tab opens without errors
- ✅ 4 metric cards show mock data:
  - Total Users: 1,234
  - Templates: 456
  - Downloads: 8,912
  - Active Today: 89
- ✅ Charts section visible (no errors in console)
- ✅ Popular Templates section visible

**Note:** Analytics currently shows mock data. Real data would come from:
```sql
SELECT COUNT(*) FROM auth.users; -- Total Users
SELECT COUNT(*) FROM templates WHERE deleted = false; -- Templates
SELECT COUNT(*) FROM user_activity_logs WHERE action_type = 'template_download'; -- Downloads
```

---

### 4. **Test Settings**
**Steps:**
1. Open Admin Panel
2. Click "Settings" tab
3. Toggle some checkboxes (Feature Flags, Maintenance Mode)
4. Change rate limits or storage limits
5. Click "Save Settings"
6. Refresh page and reopen Settings tab

**Expected Results:**
- ✅ Settings tab opens without errors
- ✅ All settings sections visible:
  - Feature Flags
  - Maintenance Mode
  - Rate Limiting
  - Storage Limits
- ✅ Changes persist after refresh (saved to localStorage)
- ✅ "Settings saved successfully!" notification appears

---

## 🔍 Database Verification

### Check Tables Exist
```sql
-- Run in Supabase SQL Editor to verify all tables exist:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN (
  'user_roles',
  'admin_roles', 
  'user_profiles',
  'error_logs',
  'user_activity_logs',
  'template_reports',
  'system_settings',
  'announcements',
  'analytics_daily'
);
```

### Check RLS Policies
```sql
-- Verify policies are non-recursive:
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'admin_roles', 'user_profiles', 'error_logs');
```

### Test Error Logging to Database
```javascript
// This should log errors to both localStorage AND Supabase:
if (window.errorLogger) {
  window.errorLogger.logError({
    type: 'runtime',
    message: 'Test database error logging',
    source: 'test.js',
    line: 1,
    column: 1
  });
}

// Then check in Supabase:
// SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 5;
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read properties of undefined (reading 'getUser')"
**Cause:** Window.supabaseClient not initialized
**Fix:** Check that Supabase is initialized in index.html before errorLogger
```javascript
// Should be in index.html:
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
```

### Issue: "infinite recursion detected in policy for relation 'user_roles'"
**Cause:** Old recursive policies still in database
**Fix:** Run `QUICK_FIX_POLICIES.sql` again in Supabase SQL Editor

### Issue: Tabs don't switch / nothing happens when clicking tabs
**Cause:** Tab listeners not reattached after injection
**Fix:** Already fixed in adminPanelEnhanced.js (reattachTabListeners method)

### Issue: "Failed to load resource: the server responded with a status of 500"
**Cause:** RLS policy blocking access OR table doesn't exist
**Fix:** 
1. Verify table exists: `SELECT * FROM table_name LIMIT 1;`
2. Check RLS policies allow access
3. Make sure you're authenticated

---

## 📊 Quick Status Check

Run this in browser console to see what's working:
```javascript
const status = {
  supabase: !!window.supabaseClient,
  errorLogger: !!window.errorLogger,
  permissionSystem: !!window.permissionSystem,
  userProfileManager: !!window.userProfileManager,
  adminPanelEnhanced: !!window.adminPanelEnhanced,
  errorCount: window.errorLogger?.errors?.length || 0,
  permissions: Object.keys(window.permissionSystem?.PERMISSIONS || {}).length,
  roles: Object.keys(window.permissionSystem?.DEFAULT_ROLES || {}).length
};
console.table(status);
```

**Expected Output:**
```
┌─────────────────────┬─────────┐
│      (index)        │ Values  │
├─────────────────────┼─────────┤
│ supabase            │  true   │
│ errorLogger         │  true   │
│ permissionSystem    │  true   │
│ userProfileManager  │  true   │
│ adminPanelEnhanced  │  true   │
│ errorCount          │  0-n    │
│ permissions         │  20+    │
│ roles               │  4      │
└─────────────────────┴─────────┘
```

---

## ✅ Success Criteria

All admin panel features work when:
- [x] SQL policies applied without errors
- [x] No infinite recursion errors
- [x] All 4 new tabs open without console errors
- [x] Error Console shows errors from errorLogger
- [x] Permissions can be edited and saved
- [x] Analytics shows metrics (mock data)
- [x] Settings can be changed and saved
- [x] Tab switching works smoothly
- [x] No 500 errors in network tab

---

## 🎉 Ready to Test!

1. **Refresh your app** (Ctrl+F5)
2. **Open browser console** (F12) to watch for errors
3. **Open Admin Panel** (click your user avatar → Admin Panel)
4. **Click each tab** and verify it opens
5. **Run the tests above**

If all tests pass, your admin panel is fully functional! 🚀
