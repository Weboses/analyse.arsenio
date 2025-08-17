/*
  # Disable RLS for leads table

  This migration disables Row Level Security for the leads table to allow
  anonymous users to insert leads through the contact form.

  ## Changes
  1. Disable RLS on leads table
  2. Remove all existing policies
  3. Allow public access for lead insertion
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous insert" ON leads;
DROP POLICY IF EXISTS "Allow authenticated read" ON leads;
DROP POLICY IF EXISTS "Allow authenticated update" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;

-- Disable Row Level Security for the leads table
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;