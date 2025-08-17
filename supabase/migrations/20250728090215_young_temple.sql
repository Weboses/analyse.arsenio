/*
  # Fix status constraint and default value

  1. Database Changes
    - Update status constraint to include 'new' status
    - Set default status to 'new' for new leads
    - Ensure proper RLS policies are in place

  2. Status Values
    - 'new': Freshly submitted leads
    - 'pending': Leads waiting for analysis
    - 'analyzed': Analysis completed
    - 'contacted': Lead has been contacted
    - 'closed': Lead process completed
*/

-- Update the status constraint to include 'new'
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
ADD CONSTRAINT leads_status_check
CHECK (
  status = ANY (ARRAY[
    'new'::text,
    'pending'::text,
    'analyzed'::text,
    'contacted'::text,
    'closed'::text
  ])
);

-- Set default status to 'new'
ALTER TABLE leads
ALTER COLUMN status SET DEFAULT 'new';

-- Ensure RLS policies allow anonymous inserts
DROP POLICY IF EXISTS "Allow anonymous inserts" ON leads;

CREATE POLICY "Allow anonymous inserts"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);