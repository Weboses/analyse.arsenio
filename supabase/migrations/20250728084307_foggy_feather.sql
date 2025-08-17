/*
  # Complete Webhook Cleanup

  This migration removes all webhook-related database objects that depend on pg_net extension:
  1. Drop all triggers that might call webhook functions
  2. Drop all webhook-related functions
  3. Ensure clean database state for lead insertion

  This allows the application to work normally while pg_net extension is being enabled.
*/

-- Drop any existing triggers on leads table that might call webhook functions
DROP TRIGGER IF EXISTS new_lead_trigger ON leads;
DROP TRIGGER IF EXISTS lead_webhook_trigger ON leads;
DROP TRIGGER IF EXISTS notify_lead_trigger ON leads;

-- Drop any webhook-related functions
DROP FUNCTION IF EXISTS notify_new_lead();
DROP FUNCTION IF EXISTS send_lead_webhook();
DROP FUNCTION IF EXISTS handle_new_lead();

-- Verify leads table structure is intact
DO $$
BEGIN
  -- Ensure leads table exists with correct structure
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    CREATE TABLE leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name text NOT NULL,
      website_url text NOT NULL,
      email text UNIQUE NOT NULL,
      phone text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'contacted', 'converted')),
      analysis_sent boolean DEFAULT false
    );
  END IF;
END $$;

-- Ensure RLS is properly configured
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create basic policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' AND policyname = 'Allow anonymous inserts'
  ) THEN
    CREATE POLICY "Allow anonymous inserts" ON leads
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END $$;