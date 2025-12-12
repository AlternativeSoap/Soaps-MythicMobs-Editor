-- ============================================
-- WORKING SOLUTION: Security Definer Function
-- ============================================
-- This function runs with elevated privileges and bypasses RLS
-- It's safe because we verify ownership in the function itself

-- First, disable RLS on templates (we'll use function-based security instead)
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Create a secure function to delete templates
CREATE OR REPLACE FUNCTION delete_template(template_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the function owner's privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
  user_uuid uuid;
  template_owner uuid;
  result json;
BEGIN
  -- Get the authenticated user ID
  user_uuid := auth.uid();
  
  -- If no user is authenticated, reject
  IF user_uuid IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Get the template's owner
  SELECT owner_id INTO template_owner
  FROM templates
  WHERE id = template_id AND deleted = false;
  
  -- If template doesn't exist or already deleted
  IF template_owner IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template not found'
    );
  END IF;
  
  -- Verify ownership
  IF template_owner != user_uuid THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You do not own this template'
    );
  END IF;
  
  -- Perform the soft delete
  UPDATE templates
  SET deleted = true, updated_at = now()
  WHERE id = template_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Template deleted successfully'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_template(uuid) TO authenticated;

-- Test the function (replace with your actual template ID)
-- SELECT delete_template('your-template-id-here'::uuid);
