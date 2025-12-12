# Quick Templates System - Developer Reference

## Quick Access

### Global Objects
```javascript
window.templateManager  // API layer for CRUD operations
window.templateEditor   // Modal component for create/edit
window.authManager      // Authentication manager
window.supabaseClient   // Supabase client
```

---

## API Reference

### TemplateManager

#### Create Template
```javascript
const template = await window.templateManager.createTemplate({
  name: 'My Template',
  description: 'A test template for combat skills',
  skillLines: ['- damage{amount=10}', '- delay{ticks=20}'],
  type: 'skill',
  category: 'Combat',
  icon: 'fa-sword',
  tags: ['damage', 'combat']
});
```

#### Get All Templates
```javascript
const templates = await window.templateManager.getAllTemplates();
console.log(templates); // Array of all templates
```

#### Get User Templates
```javascript
const userId = window.authManager.user.id;
const userTemplates = await window.templateManager.getUserTemplates(userId);
```

#### Get Template by ID
```javascript
const template = await window.templateManager.getTemplateById('uuid-here');
```

#### Update Template
```javascript
const updated = await window.templateManager.updateTemplate('uuid-here', {
  description: 'Updated description',
  tags: ['new', 'tags']
});
```

#### Delete Template
```javascript
const result = await window.templateManager.deleteTemplate('uuid-here');
console.log(result.success); // true/false
```

#### Duplicate Template
```javascript
const duplicated = await window.templateManager.duplicateTemplate(
  'uuid-here',
  'New Template Name'
);
```

---

### Auto-Detection Utilities

#### Detect Template Type
```javascript
const skillLines = ['- damage{} ~onAttack'];
const type = window.templateManager.detectTemplateType(skillLines);
console.log(type); // 'mob' or 'skill'
```

#### Suggest Category
```javascript
const skillLines = ['- damage{amount=10}', '- projectile{}'];
const category = window.templateManager.suggestCategory(skillLines);
console.log(category); // 'Combat'
```

#### Suggest Icon
```javascript
const icon = window.templateManager.suggestIcon('Combat');
console.log(icon); // 'fa-sword'
```

#### Calculate Difficulty
```javascript
const skillLines = ['- damage{}', '- delay{}', '- sound{}'];
const difficulty = window.templateManager.calculateDifficulty(skillLines);
console.log(difficulty); // 'Beginner', 'Intermediate', or 'Advanced'
```

---

### Validation

#### Validate Template
```javascript
const validation = window.templateManager.validateTemplate({
  name: 'Test',
  description: 'Too short',
  skillLines: [],
  tags: []
});

console.log(validation.valid); // false
console.log(validation.errors); // Array of error messages
```

**Validation Rules:**
- Name: 3-50 characters
- Description: 10-500 characters
- Skill Lines: 1-50 lines
- Tags: 0-10 tags, each 1-20 chars

---

### Cache Management

#### Check Cache
```javascript
const cached = localStorage.getItem('userTemplates_cache');
if (cached) {
  const data = JSON.parse(cached);
  console.log('Cached templates:', data.templates);
  console.log('Cache timestamp:', new Date(data.timestamp));
}
```

#### Invalidate Cache
```javascript
window.templateManager.invalidateCache();
```

#### Manual Cache Clear
```javascript
localStorage.removeItem('userTemplates_cache');
```

**Cache TTL:** 5 minutes (300,000ms)

---

## Template Editor

### Open Editor (Create Mode)
```javascript
window.templateEditor.open({
  skillLines: ['- damage{amount=10}'],
  type: 'skill',
  category: 'Combat',
  icon: 'fa-sword',
  onSave: (savedTemplate) => {
    console.log('Template saved:', savedTemplate);
  }
});
```

### Open Editor (Edit Mode)
```javascript
const existingTemplate = await window.templateManager.getTemplateById('uuid');
window.templateEditor.open({
  template: existingTemplate,
  onSave: (updatedTemplate) => {
    console.log('Template updated:', updatedTemplate);
  }
});
```

### Close Editor
```javascript
window.templateEditor.close();
```

---

## Template Selector

### Open Selector
```javascript
const templateSelector = new TemplateSelector(
  window.templateManager,
  window.templateEditor
);

templateSelector.onSelect((skillLines) => {
  console.log('Selected template lines:', skillLines);
  // Insert into editor
});

templateSelector.open();
```

### Refresh Templates
```javascript
templateSelector.refresh(); // Invalidates cache + reloads
```

---

## Database Queries (Advanced)

### Direct Supabase Query
```javascript
const { data, error } = await window.supabaseClient
  .from('templates')
  .select('*')
  .eq('deleted', false)
  .eq('type', 'mob')
  .order('created_at', { ascending: false });

console.log(data);
```

### Filter by Tags
```javascript
const { data, error } = await window.supabaseClient
  .from('templates')
  .select('*')
  .contains('tags', ['combat', 'damage']);
```

### Search by Name
```javascript
const { data, error } = await window.supabaseClient
  .from('templates')
  .select('*')
  .ilike('name', '%damage%');
```

---

## Permission Checks

### Check if Owner
```javascript
const template = await window.templateManager.getTemplateById('uuid');
const userId = window.authManager.user?.id;
const isOwner = template.owner_id === userId;
```

### Check if Can Edit
```javascript
function canEdit(template) {
  if (!window.authManager.user) return false;
  return template.owner_id === window.authManager.user.id;
}
```

### Check if Can Delete
```javascript
function canDelete(template) {
  if (!window.authManager.user) return false;
  return template.owner_id === window.authManager.user.id;
}
```

---

## Data Structures

### Template Object (Database)
```javascript
{
  id: 'uuid',
  owner_id: 'user-uuid',
  name: 'Template Name',
  description: 'Template description',
  data: {
    skillLines: ['- mechanic{}', '- mechanic2{}']
  },
  type: 'skill', // or 'mob'
  tags: ['tag1', 'tag2'],
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z',
  deleted: false,
  version: 1
}
```

### Template Object (UI Format)
```javascript
{
  id: 'uuid',
  owner_id: 'user-uuid',
  name: 'Template Name',
  description: 'Template description',
  skillLines: ['- mechanic{}', '- mechanic2{}'],
  type: 'skill',
  category: 'Combat',
  icon: 'fa-sword',
  tags: ['tag1', 'tag2'],
  createdAt: Date,
  updatedAt: Date
}
```

### Built-in Template Format
```javascript
{
  id: 'unique-id',
  name: 'Template Name',
  description: 'Description',
  skillLine: '- mechanic{}', // Single string, may contain \n
  category: 'Combat',
  icon: 'fa-sword'
}
```

---

## Events & Callbacks

### Template Created
```javascript
window.templateEditor.open({
  onSave: (template) => {
    console.log('New template created:', template);
    // Update UI
    // Invalidate cache
    // Show success message
  }
});
```

### Template Updated
```javascript
window.templateEditor.open({
  template: existingTemplate,
  onSave: (template) => {
    console.log('Template updated:', template);
    // Update UI
    // Invalidate cache
  }
});
```

### Template Deleted
```javascript
async function deleteTemplate(id) {
  const result = await window.templateManager.deleteTemplate(id);
  if (result.success) {
    console.log('Template deleted');
    // Update UI
    // Invalidate cache
  }
}
```

### Template Selected
```javascript
templateSelector.onSelect((skillLines) => {
  console.log('User selected template with lines:', skillLines);
  // Insert into skill builder
});
```

---

## Error Handling

### Try-Catch Pattern
```javascript
try {
  const template = await window.templateManager.createTemplate({
    name: 'Test',
    description: 'Description',
    skillLines: ['- damage{}']
  });
  console.log('Success:', template);
} catch (error) {
  console.error('Error:', error.message);
  // Show user-friendly error
}
```

### Validation Errors
```javascript
const validation = window.templateManager.validateTemplate(data);
if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error('Validation error:', error);
  });
}
```

### Network Errors
```javascript
try {
  const templates = await window.templateManager.getAllTemplates();
} catch (error) {
  if (error.message.includes('network')) {
    console.error('Network error - check connection');
  } else if (error.message.includes('unauthorized')) {
    console.error('Auth error - login required');
  }
}
```

---

## Debugging

### Enable Debug Mode
```javascript
window.DEBUG_TEMPLATES = true;
```

### Check Supabase Connection
```javascript
const { data, error } = await window.supabaseClient
  .from('templates')
  .select('count');

console.log('Templates count:', data);
```

### Check Auth State
```javascript
console.log('Current user:', window.authManager.user);
console.log('Is authenticated:', !!window.authManager.user);
```

### Inspect Cache
```javascript
const cache = localStorage.getItem('userTemplates_cache');
console.log('Cache:', JSON.parse(cache));
```

### Monitor API Calls
```javascript
// Open browser Network tab
// Filter by "templates"
// Check request/response
```

---

## Common Patterns

### Create Template from Skill Builder
```javascript
// In skillLineBuilder.js
async showTemplateSaveDialog() {
  const skillLines = this.getCurrentSkillLines();
  const type = window.templateManager.detectTemplateType(skillLines);
  const category = window.templateManager.suggestCategory(skillLines);
  const icon = window.templateManager.suggestIcon(category);
  
  window.templateEditor.open({
    skillLines,
    type,
    category,
    icon,
    onSave: async (template) => {
      console.log('Template saved:', template);
      // Optionally clear builder
    }
  });
}
```

### Load Templates on Page Load
```javascript
async function loadTemplates() {
  try {
    const templates = await window.templateManager.getAllTemplates();
    renderTemplates(templates);
  } catch (error) {
    console.error('Failed to load templates:', error);
    showErrorMessage('Could not load templates');
  }
}
```

### Filter Templates by Type
```javascript
const templates = await window.templateManager.getAllTemplates();
const mobTemplates = templates.filter(t => t.type === 'mob');
const skillTemplates = templates.filter(t => t.type === 'skill');
```

### Search Templates
```javascript
const templates = await window.templateManager.getAllTemplates();
const searchTerm = 'damage';
const results = templates.filter(t => 
  t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
  t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
);
```

---

## Best Practices

### 1. Always Validate Before Saving
```javascript
const validation = window.templateManager.validateTemplate(data);
if (!validation.valid) {
  alert(validation.errors.join('\n'));
  return;
}
```

### 2. Handle Errors Gracefully
```javascript
try {
  await window.templateManager.createTemplate(data);
} catch (error) {
  console.error(error);
  alert('Failed to save template. Please try again.');
}
```

### 3. Invalidate Cache After Mutations
```javascript
await window.templateManager.createTemplate(data);
window.templateManager.invalidateCache();
```

### 4. Check Auth Before Protected Actions
```javascript
if (!window.authManager.user) {
  alert('Please login to create templates');
  return;
}
```

### 5. Use Auto-Detection for Better UX
```javascript
const type = window.templateManager.detectTemplateType(skillLines);
const category = window.templateManager.suggestCategory(skillLines);
const icon = window.templateManager.suggestIcon(category);
```

---

## Performance Tips

### 1. Cache Templates Locally
- Templates cached for 5 minutes
- Manual refresh available
- Auto-invalidate on mutations

### 2. Debounce Search Input
```javascript
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(e.target.value);
  }, 300);
});
```

### 3. Virtual Scrolling for Large Lists
```javascript
// Future enhancement
// Use VirtualScrollManager for 100+ templates
```

### 4. Lazy Load Template Details
```javascript
// Load summary first
const templates = await window.templateManager.getAllTemplates();

// Load full details on demand
const fullTemplate = await window.templateManager.getTemplateById(id);
```

---

## Migration Notes

### From Old System to New System

**Old Format (Built-in):**
```javascript
{
  id: 'basic-damage',
  skillLine: '- damage{amount=10}\n- delay{ticks=20}'
}
```

**New Format (User Templates):**
```javascript
{
  id: 'uuid',
  skillLines: ['- damage{amount=10}', '- delay{ticks=20}']
}
```

**Compatibility:**
```javascript
// selectTemplate() handles both
selectTemplate(templateId) {
  const template = this.allTemplates.find(t => t.id === templateId);
  
  let skillLines;
  if (template.skillLine) {
    // Old format
    skillLines = this.extractSkillLines(template.skillLine);
  } else if (template.skillLines) {
    // New format
    skillLines = template.skillLines;
  }
  
  this.onSelectCallback(skillLines);
}
```

---

## Troubleshooting

### Templates Not Loading
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies
4. Try manual refresh

### Cannot Create Template
1. Verify user is logged in
2. Check validation errors
3. Verify RLS policies allow insert

### Cannot Edit Template
1. Verify you own the template
2. Check `owner_id` matches current user
3. Verify RLS policies allow update

### Cache Not Updating
1. Click refresh button
2. Check cache TTL (5 min)
3. Clear cache manually

---

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **RLS Policies:** `database_migrations/002_create_templates_table.sql`
- **Implementation Guide:** `IMPLEMENTATION_COMPLETE.md`
- **Testing Guide:** `TESTING_GUIDE.md`

---

🚀 **Ready to Build!** 🚀
