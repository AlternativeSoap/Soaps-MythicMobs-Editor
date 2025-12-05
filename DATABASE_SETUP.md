# Supabase Database Setup

## Setup Instructions

### 1. Create the Database Table

1. Go to your Supabase project: https://yzsbvxuciuvmvoswtjkl.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `database_schema.sql`
5. Click **Run** to execute the SQL

### 2. Verify Table Creation

1. Go to **Table Editor** in the left sidebar
2. You should see a new table called `user_data`
3. The table should have these columns:
   - `id` (uuid, primary key)
   - `user_id` (text)
   - `key` (text)
   - `value` (jsonb)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### 3. Test the Integration

1. Open your MythicMobs Editor in the browser
2. Check the console for these messages:
   - `✅ Supabase client initialized`
   - `✅ Using cloud storage (Supabase)`
3. Create or edit a pack
4. Go back to Supabase **Table Editor** > `user_data`
5. You should see new rows with your pack data

## How It Works

### Data Storage
- All pack data is automatically synced to Supabase cloud storage
- Data is also saved to localStorage as a backup
- If offline or Supabase fails, it falls back to localStorage

### Anonymous Users
- Users without authentication get a unique anonymous ID
- This ID is stored in localStorage and persists across sessions
- All their data is associated with this anonymous ID

### Authentication (Optional)
To add proper user authentication:

1. Enable Email/Password or Social auth in Supabase
2. Update `supabaseClient.js` to handle login/signup
3. Users will then have proper accounts with their data synced

### Data Structure

Example of data stored in `user_data` table:

```json
{
  "user_id": "anon_1733404800000_xyz123",
  "key": "packs",
  "value": [
    {
      "id": "1733404800001",
      "name": "My Pack",
      "mobs": [...],
      "skills": [...],
      ...
    }
  ],
  "updated_at": "2025-12-05T10:30:00Z"
}
```

## Sync Features

### Manual Sync Commands (in console)

```javascript
// Sync localStorage to cloud
await editor.storage.syncToCloud();

// Sync cloud to localStorage
await editor.storage.syncFromCloud();

// Get all stored keys
const keys = await editor.storage.getAllKeys();
console.log('Stored keys:', keys);
```

## Troubleshooting

### Can't connect to Supabase
- Check browser console for error messages
- Verify the API key is correct
- Check Supabase project status
- Falls back to localStorage automatically

### Data not syncing
- Open browser console and check for errors
- Verify Row Level Security policies are correct
- Check that anonymous access is enabled

### Clear all data
```javascript
// Clear both cloud and local storage
await editor.storage.clear();
```

## Security Notes

- Current setup allows anonymous access (anyone can read/write their own data)
- Each anonymous user has a unique ID
- For production, consider implementing proper authentication
- API key shown is the public anonymous key (safe to expose)

## Database Policies

Current RLS policy allows all users to access their own data. To restrict further:

```sql
-- Only allow users to access their own data
CREATE POLICY "Users can only access own data"
    ON user_data
    FOR ALL
    USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
```
