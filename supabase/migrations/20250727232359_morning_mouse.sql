/*
  # Update leads table to properly handle first_name field

  1. Changes
    - Remove default value from first_name column
    - Update first_name column to be properly configured for user input
    - Add validation constraint for minimum name length

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Remove default value and update first_name column
ALTER TABLE leads ALTER COLUMN first_name DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN first_name SET NOT NULL;

-- Add constraint for minimum name length
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_first_name_length_check' 
    AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_first_name_length_check 
    CHECK (length(trim(first_name)) >= 2);
  END IF;
END $$;

-- Add comment to clarify the field purpose
COMMENT ON COLUMN leads.first_name IS 'Customer first name for personalized communication';