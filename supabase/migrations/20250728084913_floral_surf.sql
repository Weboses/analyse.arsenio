/*
  # Fix SQL syntax error and ensure clean database state

  1. Clean Database State
    - Drop any existing problematic triggers/functions
    - Ensure leads table exists with correct structure
  
  2. Security
    - Enable RLS on leads table
    - Create policy for anonymous inserts (correct syntax)
  
  3. Notes
    - Uses DROP IF EXISTS to avoid errors
    - Uses correct CREATE POLICY syntax without IF NOT EXISTS
*/

-- Clean up any existing webhook-related objects
DROP TRIGGER IF EXISTS notify_n8n_trigger ON leads;
DROP FUNCTION IF EXISTS notify_n8n_webhook();
DROP FUNCTION IF EXISTS send_webhook_to_n8n();

-- Ensure leads table exists with correct structure
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL CHECK (length(TRIM(BOTH FROM first_name)) >= 2),
  website_url text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'contacted', 'converted')),
  analysis_sent boolean DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_analysis_sent_idx ON leads (analysis_sent);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow anonymous inserts" ON leads;

-- Create policy for anonymous inserts (correct syntax)
CREATE POLICY "Allow anonymous inserts" 
  ON leads 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();