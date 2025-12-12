# Quick Templates System - Testing Guide

## Quick Start Testing

### 1. Open the Application
```
Open index.html in your browser
```

### 2. Test Guest User Flow (Not Logged In)

#### View Templates
1. Click "Quick Build" or "From Template" in skill builder
2. **Expected:** See all templates with sections:
   - Built-in Templates (green "Built-in" badge)
   - Community Templates (blue username badges)
3. **Expected:** No "Your Templates" section
4. **Expected:** Each template shows [Use] [Duplicate] buttons only

#### Use Template
1. Click [Use] on any template
2. **Expected:** Skill lines inserted into editor
3. **Expected:** Modal closes

#### Duplicate Template
1. Click [Duplicate] on any template
2. **Expected:** Nothing happens (requires login)
3. **Expected:** Or redirects to login

#### Check "Save as Template" Button
1. Open Skill Line Builder
2. Add some skill lines to queue
3. **Expected:** "Save as Template" button is HIDDEN

---

### 3. Test Logged-In User Flow

#### Login
1. Click login button (top-right)
2. Enter credentials
3. **Expected:** Login successful
4. **Expected:** See user avatar/name

#### View Templates
1. Open template selector
2. **Expected:** See three sections:
   - Built-in Templates
   - Community Templates  
   - Your Templates (purple "You" badge)
3. **Expected:** Your templates show [Use] [Duplicate] [Edit] [Delete]
4. **Expected:** Others' templates show [Use] [Duplicate] only

#### Create Template via "Save as Template"
1. Open Skill Line Builder
2. Add mechanic: `damage{amount=10}`
3. Add to queue
4. **Expected:** "Save as Template" button appears
5. Click "Save as Template"
6. **Expected:** Template Editor modal opens
7. **Expected:** Fields auto-filled:
   - Type: "skill" (read-only)
   - Category: "Combat" (suggested)
   - Icon: "fa-sword" (suggested)
8. Fill in:
   - Name: "Test Template"
   - Description: "This is a test template for damage"
9. **Expected:** Character counters update (e.g., "14/50")
10. **Expected:** Save button enabled
11. Click "Save Template"
12. **Expected:** Success message
13. **Expected:** Prompt to clear builder
14. **Expected:** New template appears in "Your Templates" section

#### Edit Your Template
1. Find your template in "Your Templates"
2. Click [Edit]
3. **Expected:** Template Editor opens with existing data
4. Change description to "Updated description"
5. Click "Save Template"
6. **Expected:** Success message
7. **Expected:** Template list refreshes
8. **Expected:** Description updated

#### Duplicate Any Template
1. Click [Duplicate] on any template (yours or community)
2. **Expected:** Template Editor opens
3. **Expected:** Name has "(Copy)" suffix
4. **Expected:** All other fields copied
5. Edit name to remove "(Copy)"
6. Click "Save Template"
7. **Expected:** New template created in "Your Templates"

#### Delete Your Template
1. Find your template
2. Click [Delete]
3. **Expected:** Confirmation dialog
4. Click "OK"
5. **Expected:** Template removed from list
6. **Expected:** Success message

#### Try to Edit/Delete Others' Templates
1. Find a community template (not yours)
2. **Expected:** No [Edit] or [Delete] buttons
3. **Expected:** Only [Use] and [Duplicate]

---

### 4. Test Validation

#### Name Validation
1. Create new template
2. Leave name empty
3. **Expected:** Save button disabled
4. Enter "ab" (2 chars)
5. **Expected:** Character counter red
6. Enter "abc" (3 chars)
7. **Expected:** Character counter green
8. Enter 51 characters
9. **Expected:** Input limited to 50 chars

#### Description Validation
1. Enter "short" (5 chars)
2. **Expected:** Character counter red
3. Enter "This is a valid description" (10+ chars)
4. **Expected:** Character counter green
5. Try to enter 501 characters
6. **Expected:** Input limited to 500 chars

#### Skill Lines Validation
1. Try to save template with 0 skill lines
2. **Expected:** Error message
3. Add 50+ skill lines
4. **Expected:** Error message "Max 50 lines"

#### Tags Validation
1. Add tag "combat"
2. **Expected:** Tag chip appears
3. Add 10 tags
4. **Expected:** Cannot add 11th tag
5. Click X on tag chip
6. **Expected:** Tag removed

---

### 5. Test Auto-Detection

#### Mob vs Skill Type
1. Create template with `damage{} ~onAttack`
2. **Expected:** Type = "mob"
3. Create template with `damage{}` (no trigger)
4. **Expected:** Type = "skill"

#### Category Detection
1. Lines with `damage`, `projectile`
   - **Expected:** Category = "Combat"
2. Lines with `heal`, `potion`
   - **Expected:** Category = "Healing"
3. Lines with `teleport`, `velocity`
   - **Expected:** Category = "Movement"
4. Lines with `particle`, `sound`
   - **Expected:** Category = "Effects"
5. Other mechanics
   - **Expected:** Category = "General"

#### Icon Suggestion
- Combat → fa-sword
- Healing → fa-heart
- Movement → fa-running
- Effects → fa-sparkles
- General → fa-star

#### Difficulty
1. 1-3 lines → "Beginner"
2. 4-7 lines → "Intermediate"
3. 8+ lines → "Advanced"

---

### 6. Test Caching

#### Initial Load
1. Open template selector
2. **Expected:** Loading spinner shows
3. **Expected:** Templates load from Supabase
4. **Expected:** Cache saved

#### Second Load (within 5 minutes)
1. Close and reopen template selector
2. **Expected:** Templates load INSTANTLY (from cache)
3. **Expected:** No loading spinner

#### Cache Invalidation
1. Click [Refresh] button
2. **Expected:** Loading spinner shows
3. **Expected:** Templates reload from Supabase
4. **Expected:** Cache updated

#### Cache After Create/Update/Delete
1. Create new template
2. **Expected:** Cache invalidated
3. **Expected:** Template list refreshes
4. Edit template
5. **Expected:** Cache invalidated
6. Delete template
7. **Expected:** Cache invalidated

---

### 7. Test UI/UX

#### Section Rendering
1. Check "Built-in Templates" section
   - **Expected:** Green "Built-in" badge
   - **Expected:** Sorted alphabetically
2. Check "Community Templates" section
   - **Expected:** Blue username badges
   - **Expected:** Not your templates
3. Check "Your Templates" section
   - **Expected:** Purple "You" badge
   - **Expected:** Only your templates

#### Owner Badges
- Built-in: Green with "Built-in" text
- Others: Blue with username
- Yours: Purple with "You" text

#### Button Visibility
| Template Type | Use | Duplicate | Edit | Delete |
|---------------|-----|-----------|------|--------|
| Built-in      | ✅  | ✅        | ❌   | ❌     |
| Community     | ✅  | ✅        | ❌   | ❌     |
| Yours         | ✅  | ✅        | ✅   | ✅     |

#### Character Counters
- Green: < 80% of max
- Yellow: 80-95% of max
- Red: > 95% of max

#### Keyboard Shortcuts
1. Open Template Editor
2. Press Escape
   - **Expected:** Modal closes
3. Open Template Editor
4. Fill valid data
5. Press Ctrl+Enter
   - **Expected:** Template saved

---

### 8. Test Error Handling

#### Network Error
1. Disconnect internet
2. Try to load templates
3. **Expected:** Error message "Failed to load templates"
4. **Expected:** Retry option

#### Invalid Data
1. Try to save template with invalid JSON
2. **Expected:** Validation error
3. **Expected:** User-friendly message

#### Duplicate Name
1. Create template "Test"
2. Create another template "Test"
3. **Expected:** Allowed (no unique constraint)
4. **Note:** User can have multiple templates with same name

#### Server Error
1. Simulate 500 error from Supabase
2. **Expected:** Error message
3. **Expected:** Fallback to cached data

---

### 9. Test Permission Enforcement

#### Supabase RLS Policies
1. Check as guest:
   - **Expected:** Can read all non-deleted templates
   - **Expected:** Cannot create/update/delete
2. Check as logged-in user:
   - **Expected:** Can read all
   - **Expected:** Can create own
   - **Expected:** Can update own only
   - **Expected:** Can delete own only

#### Frontend Permission Checks
1. Verify `isOwner()` returns true only for own templates
2. Verify `canEdit()` returns true only for own templates
3. Verify `canDelete()` returns true only for own templates
4. Verify buttons hidden/disabled based on permissions

---

### 10. Test Performance

#### Large Template List
1. Create 50+ templates
2. Open template selector
3. **Expected:** Renders smoothly
4. **Expected:** No lag or freezing
5. **Note:** Pagination infrastructure ready for future

#### Virtual Scrolling
- **Note:** Not yet implemented
- **Future:** Add when list > 100 templates

#### Debouncing
1. Type rapidly in search field (if implemented)
2. **Expected:** Search only after pause
3. **Note:** Can add later

---

## Common Issues & Solutions

### Issue: "Save as Template" button not visible
**Solution:** 
- Check user is logged in
- Check skill builder has content (queue or valid line)

### Issue: Templates not loading
**Solution:**
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies
- Try refresh button

### Issue: Cannot edit template
**Solution:**
- Verify you own the template
- Check `owner_id` matches logged-in user
- Check RLS policies

### Issue: Cache not updating
**Solution:**
- Click refresh button
- Check cache TTL (5 minutes)
- Clear browser cache

### Issue: Auto-detection wrong
**Solution:**
- Check skill lines format
- Verify trigger detection logic
- Manually override in editor

---

## Browser Console Debugging

### Enable Debug Logs
```javascript
// Check templateManager logs
console.log(window.templateManager);

// Check cached templates
const cache = localStorage.getItem('userTemplates_cache');
console.log(JSON.parse(cache));

// Check auth state
console.log(window.authManager.user);
```

### Clear Cache Manually
```javascript
localStorage.removeItem('userTemplates_cache');
```

### Check Supabase Connection
```javascript
console.log(window.supabaseClient);
```

---

## Automated Testing (Future)

### Unit Tests
- templateManager methods
- Validation logic
- Auto-detection algorithms
- Permission checks

### Integration Tests
- Template CRUD flow
- Cache behavior
- Supabase integration
- UI interactions

### E2E Tests (Cypress/Playwright)
- Full user workflows
- Guest vs logged-in flows
- Error scenarios
- Performance benchmarks

---

## Success Criteria

✅ Guest users can view and use all templates  
✅ Logged-in users can create/edit/delete own templates  
✅ Permission enforcement works correctly  
✅ Caching reduces API calls  
✅ Auto-detection provides smart defaults  
✅ Validation prevents invalid data  
✅ UI is intuitive and responsive  
✅ No console errors  
✅ Backward compatibility maintained  

---

## Feedback & Bug Reports

**Report Issues:**
1. Browser console errors
2. Network tab (failed requests)
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots/videos if applicable

**Feature Requests:**
- Search/filter templates
- Template ratings
- Template versioning
- Import/export
- Categories tabs
- Favorites system

---

🧪 **Happy Testing!** 🧪
