# Enhanced Admin Panel - Implementation Guide

## Overview

The Enhanced Admin Panel provides comprehensive administrative features including error monitoring, permission management, analytics, system configuration, and user profile management.

## Features Implemented

### 1. Error Console
- **Real-time error monitoring** from all users
- **Error filtering** by type, search term, and time range
- **Error statistics** showing counts by type
- **Export functionality** to download error logs as JSON
- **Auto-refresh** every 30 seconds

### 2. Permission Management
- **Role selector** to view/edit permissions for different roles
- **Permission checkboxes** organized by category
- **Custom permission configuration** saved to localStorage
- **Default roles**: user, moderator, template_admin, super_admin
- **20+ permissions** across templates, users, admin, and packs

### 3. Analytics Dashboard
- **Metrics cards** showing:
  - Total registered users
  - Total templates created
  - Template downloads
  - Active users (last 30 days)
- **Chart placeholders** for future Chart.js integration
- **Popular templates** list with download counts

### 4. System Settings
- **Feature flags** (template sharing, AI suggestions, skill validation)
- **Maintenance mode** toggle with custom message
- **Rate limiting** configuration
- **Storage limits** per user
- **Auto-save** to localStorage

### 5. User Profile Management
- **Display name** system for all users
- **Profile editor** accessible from user dropdown
- **Supabase integration** for profile storage
- **UI updates** to show display names instead of emails

### 6. Global Error Logger
- **Captures all errors** globally:
  - Runtime errors (window.onerror)
  - Unhandled promise rejections
  - Console.error calls
- **Stores errors** in memory (max 1000) and localStorage
- **Sends to Supabase** if user is admin
- **Provides notifications** for new errors

## Architecture

### Core Systems

#### 1. ErrorLogger (`utils/errorLogger.js`)
```javascript
class ErrorLogger {
  setupGlobalHandlers()    // Attach to window.onerror, etc.
  logError(error)          // Store error with timestamp
  getErrors(filter)        // Retrieve filtered errors
  exportErrors()           // Export as JSON
  clearErrors()            // Clear all errors
  subscribe(callback)      // Subscribe to new errors
}
```

#### 2. PermissionSystem (`utils/permissionSystem.js`)
```javascript
class PermissionSystem {
  getRolePermissions(role)           // Get permissions array for role
  setRolePermissions(role, perms)    // Save custom permissions
  hasPermission(userRoles, perm)     // Check if user has permission
  canEditTemplate(userRoles, template)  // Helper for template editing
  canDeleteTemplate(userRoles, template) // Helper for template deletion
}
```

#### 3. UserProfileManager (`components/userProfileManager.js`)
```javascript
class UserProfileManager {
  loadProfile()            // Fetch from Supabase
  saveProfile()            // Upsert to Supabase
  showProfileEditor()      // Open edit dialog
  getDisplayName()         // Get current display name
  updateUIWithProfile()    // Update UI elements
}
```

#### 4. AdminPanelEnhanced (`components/adminPanelEnhanced.js`)
```javascript
class AdminPanelEnhanced {
  injectNewTabs()          // Add tabs to existing panel
  setupErrorConsole()      // Initialize error monitoring
  setupPermissionsEditor() // Initialize permission editor
  setupAnalytics()         // Initialize analytics dashboard
  setupSettings()          // Initialize settings panel
}
```

## File Structure

```
utils/
  errorLogger.js           # Global error capture system
  permissionSystem.js      # Role-based permission management

components/
  userProfileManager.js    # User profile and display name management
  adminPanelEnhanced.js    # Enhanced admin panel with 4 new tabs

styles/
  adminPanelEnhanced.css   # Styling for all new features
```

## Database Schema

See `ADMIN_PANEL_DATABASE_SCHEMA.sql` for complete schema.

### Required Tables:
1. **user_profiles** - User display names and avatars
2. **error_logs** - Client-side error logging
3. **user_activity_logs** - User action tracking
4. **template_reports** - Template moderation reports
5. **system_settings** - System configuration
6. **announcements** - System announcements
7. **analytics_daily** - Aggregated analytics data

## Setup Instructions

### 1. Database Setup
```bash
# Open Supabase SQL Editor
# Run ADMIN_PANEL_DATABASE_SCHEMA.sql
# Verify all tables created successfully
```

### 2. Frontend Integration
All files are already integrated in `index.html`:
- CSS: Line 37 (`adminPanelEnhanced.css`)
- Scripts: Lines 710-712 (core systems)
- Scripts: Line 771 (adminPanelEnhanced.js)
- Initialization: Lines 844-891 (admin and profile setup)

### 3. Testing Checklist

#### Error Console
- [ ] Open Admin Panel → Error Console tab
- [ ] Trigger an error (e.g., call undefined function in console)
- [ ] Verify error appears in list
- [ ] Test filtering by type
- [ ] Test search functionality
- [ ] Test export button

#### Permissions
- [ ] Open Admin Panel → Permissions tab
- [ ] Select a role from dropdown
- [ ] Toggle some permissions
- [ ] Click Save
- [ ] Refresh page and verify permissions persisted

#### Analytics
- [ ] Open Admin Panel → Analytics tab
- [ ] Verify metrics cards show data
- [ ] Check popular templates list

#### Settings
- [ ] Open Admin Panel → Settings tab
- [ ] Toggle feature flags
- [ ] Enable maintenance mode
- [ ] Change rate limiting values
- [ ] Save settings
- [ ] Refresh and verify persistence

#### User Profiles
- [ ] Click user avatar → Edit Profile
- [ ] Enter display name
- [ ] Save
- [ ] Verify display name shows in UI
- [ ] Check database for user_profiles entry

## Usage

### For Admins

#### Viewing Errors
1. Open Admin Panel
2. Click "Error Console" tab
3. Use filters to narrow down errors:
   - **Type Filter**: Show only specific error types
   - **Search**: Find errors containing text
   - **Time Range**: Filter by last hour, day, week, or all time
4. Click "Export Errors" to download JSON

#### Managing Permissions
1. Open Admin Panel
2. Click "Permissions" tab
3. Select role from dropdown
4. Check/uncheck permissions by category:
   - **Templates**: Create, edit, delete, share, feature
   - **Users**: View, edit, delete, grant roles
   - **Admin**: Access panel, view logs, manage system
   - **Packs**: Create, edit, delete, share
5. Click "Save Permissions"

#### Viewing Analytics
1. Open Admin Panel
2. Click "Analytics" tab
3. View metrics:
   - Total users
   - Total templates
   - Downloads
   - Active users
4. See popular templates with download counts

#### Configuring System
1. Open Admin Panel
2. Click "Settings" tab
3. Toggle features on/off
4. Enable maintenance mode with custom message
5. Adjust rate limiting (calls per window)
6. Set storage limits per user
7. Changes save automatically

### For All Users

#### Setting Display Name
1. Click user avatar in top-right
2. Click "Edit Profile"
3. Enter desired display name
4. Click OK
5. Display name now shows instead of email

## API Integration

### Supabase Queries

#### Load User Profile
```javascript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### Save User Profile
```javascript
const { error } = await supabase
  .from('user_profiles')
  .upsert({
    user_id: userId,
    email: userEmail,
    display_name: displayName,
    updated_at: new Date()
  });
```

#### Log Error to Database
```javascript
const { error } = await supabase
  .from('error_logs')
  .insert({
    user_id: userId,
    error_type: errorType,
    message: message,
    stack_trace: stack,
    timestamp: new Date()
  });
```

#### Load Analytics
```javascript
const { data, error } = await supabase
  .from('analytics_daily')
  .select('*')
  .gte('date', thirtyDaysAgo)
  .order('date', { ascending: false });
```

## Extending the System

### Adding New Permissions

Edit `utils/permissionSystem.js`:
```javascript
const PERMISSIONS = {
  // ... existing permissions
  'new_category': {
    'new_action': 'category.action'
  }
};

const DEFAULT_ROLES = {
  'role_name': [
    // ... existing permissions
    'category.action'
  ]
};
```

### Adding New Error Types

Errors are automatically categorized. To add custom error logging:
```javascript
window.errorLogger.logError({
  type: 'custom',
  message: 'Custom error message',
  source: 'myComponent.js',
  line: 123,
  stack: new Error().stack
});
```

### Adding New Analytics Metrics

Edit `components/adminPanelEnhanced.js` in `loadAnalytics()`:
```javascript
async loadAnalytics() {
  // Fetch new metric from Supabase
  const { data } = await supabase
    .from('analytics_daily')
    .select('value')
    .eq('metric', 'new_metric')
    .single();
  
  // Update UI
  document.querySelector('.metric-value').textContent = data.value;
}
```

### Adding New System Settings

Edit `components/adminPanelEnhanced.js` in `setupSettings()`:
```javascript
setupSettings() {
  const content = `
    <div class="settings-section">
      <h3>New Feature</h3>
      <div class="setting-item">
        <label class="toggle-label">
          <input type="checkbox" id="new-feature" ${settings.newFeature ? 'checked' : ''}>
          <span>Enable New Feature</span>
        </label>
      </div>
    </div>
  `;
  // ... rest of setup
}
```

## Performance Considerations

### Error Logger
- **Memory Limit**: Max 1000 errors in memory
- **LocalStorage**: Persists across sessions
- **Supabase**: Only admins send errors to database
- **Auto-refresh**: Error console updates every 30 seconds

### Permission System
- **Cache**: Custom permissions cached in localStorage
- **Fallback**: Uses DEFAULT_ROLES if no custom config
- **Validation**: Checks happen in O(1) time using Set

### User Profiles
- **Caching**: Profile loaded once and cached
- **Batch Updates**: UI updates happen after profile load
- **Lazy Loading**: Only loads when user logs in

## Troubleshooting

### Errors Not Appearing in Console
1. Check if errorLogger initialized:
   ```javascript
   console.log(window.errorLogger);
   ```
2. Check browser console for initialization errors
3. Verify admin panel opened successfully
4. Check error filters (might be filtering out errors)

### Permissions Not Saving
1. Check localStorage for `customPermissions`:
   ```javascript
   console.log(localStorage.getItem('customPermissions'));
   ```
2. Verify PermissionSystem initialized:
   ```javascript
   console.log(window.permissionSystem);
   ```
3. Check browser console for save errors

### Display Name Not Updating
1. Check Supabase connection
2. Verify user_profiles table exists
3. Check browser console for save errors:
   ```javascript
   console.log(window.userProfileManager);
   ```
4. Check if RLS policies allow user updates

### Analytics Not Loading
1. Check if user is admin
2. Verify Supabase tables exist
3. Check browser console for query errors
4. Ensure RLS policies allow admin reads

## Security Considerations

### Row Level Security (RLS)
All tables use RLS policies:
- **user_profiles**: Users can only edit own profile
- **error_logs**: Admins can view all, users can insert
- **template_reports**: Users can view own, admins can view all
- **system_settings**: Anyone can read, only admins can write

### Permission Checks
Always check permissions before sensitive operations:
```javascript
if (!window.permissionSystem.hasPermission(userRoles, 'admin.manage_system')) {
  throw new Error('Insufficient permissions');
}
```

### Input Validation
- Display names sanitized before storage
- Error messages sanitized before display
- Settings validated before save

## Future Enhancements

### Phase 2 (Data Integration)
- [ ] Real analytics data from Supabase
- [ ] Chart.js integration for graphs
- [ ] User activity logs table and queries
- [ ] Template moderation queue
- [ ] Featured templates system

### Phase 3 (Advanced Features)
- [ ] User search/filter in admin users tab
- [ ] Bulk user operations
- [ ] Template report/flag system
- [ ] Announcement system
- [ ] Maintenance mode enforcement
- [ ] Rate limiting implementation

### Phase 4 (Polish)
- [ ] Email notifications for errors
- [ ] Error grouping by similarity
- [ ] Analytics export to CSV
- [ ] Template analytics per user
- [ ] Performance metrics dashboard

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database tables exist
3. Check RLS policies are correct
4. Review this guide for common issues

## Changelog

### Version 1.0.0 (Current)
- ✅ Error console with real-time monitoring
- ✅ Permission management with role editor
- ✅ Analytics dashboard with metrics
- ✅ System settings panel
- ✅ User profile management
- ✅ Display name system
- ✅ Global error logger
- ✅ Database schema and RLS policies
