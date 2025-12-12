-- ============================================
-- Check Table Structure and Constraints
-- ============================================

-- 1. Check the templates table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'templates'
ORDER BY ordinal_position;

-- 2. Check for any constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'templates'::regclass;

-- 3. Check for triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'templates';

-- 4. Try to manually update a template (replace the ID with yours)
-- This will help us see the actual error
UPDATE templates 
SET deleted = true 
WHERE id = '5a555052-2c03-4a4e-8a87-8a5520f06108'
RETURNING *;

-- If that fails, try with explicit owner check
UPDATE templates 
SET deleted = true 
WHERE id = '5a555052-2c03-4a4e-8a87-8a5520f06108'
AND owner_id = auth.uid()
RETURNING *;
