-- ============================================
-- Test if JS Client Role is Different
-- ============================================

-- Check what role the current connection is using
SELECT current_user, current_role;

-- Check what roles have access to templates
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'templates';

-- The JS client uses the 'anon' or 'authenticated' role
-- Let's verify the policies apply to both

-- Show which roles each policy targets
SELECT 
    schemaname,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'templates';

-- POTENTIAL FIX: Make UPDATE policy apply to PUBLIC (both anon and authenticated)
-- If the above shows the policy only applies to 'authenticated' but JS client uses 'anon'

DROP POLICY IF EXISTS "update_policy" ON templates;

CREATE POLICY "update_policy"
  ON templates
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
  -- Note: Removed "TO authenticated" to make it apply to all roles

-- Verify
SELECT policyname, cmd, roles, qual::text, with_check::text
FROM pg_policies 
WHERE tablename = 'templates' AND policyname = 'update_policy';
