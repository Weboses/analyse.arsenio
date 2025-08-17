/*
  # Remove unused phone column

  1. Changes
    - Remove `phone` column from `leads` table
    - Clean up database schema to match our simplified approach

  2. Reason
    - We only use 4 core fields: id, first_name, email, website_url
    - Phone field is not needed for the current workflow
*/

-- Remove the phone column as it's not used in our simplified approach
ALTER TABLE leads DROP COLUMN IF EXISTS phone;

-- Verify the table structure now only contains the fields we need:
-- id, first_name, website_url, email, created_at, updated_at, status, analysis_sent