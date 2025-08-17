/*
  # Complete Supabase Reset and Setup

  This migration completely resets and sets up the leads system from scratch:

  1. Clean up existing functions and triggers
  2. Recreate leads table with only required fields
  3. Create new RPC function without phone field
  4. Set up proper RLS policies
  5. Create indexes for performance

  Required fields only:
  - id (uuid, primary key)
  - first_name (text)
  - email (text, unique)
  - website_url (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  - status (text)
  - analysis_sent (boolean)
  - analysis_content (text, nullable)
  - analysis_sent_at (timestamptz, nullable)
*/

-- 1. DROP ALL EXISTING FUNCTIONS AND TRIGGERS
DROP FUNCTION IF EXISTS notify_new_lead(text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS notify_new_lead(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS notify_new_lead(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS notify_new_lead_function() CASCADE;

-- 2. DROP AND RECREATE LEADS TABLE
DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL CHECK (length(trim(first_name)) >= 2),
  email text UNIQUE NOT NULL,
  website_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'new' CHECK (status IN ('new', 'pending', 'analyzed', 'contacted', 'closed')),
  analysis_sent boolean DEFAULT false,
  analysis_content text,
  analysis_sent_at timestamptz
);

-- 3. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE UPDATED_AT TRIGGER
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. CREATE RPC FUNCTION (ONLY 3 PARAMETERS)
CREATE OR REPLACE FUNCTION notify_new_lead(
  first_name text,
  email text,
  website_url text
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
  normalized_url text;
BEGIN
  -- Normalize URL (add https:// if missing)
  normalized_url := website_url;
  IF NOT (normalized_url ~ '^https?://') THEN
    normalized_url := 'https://' || normalized_url;
  END IF;

  -- Insert lead into table
  INSERT INTO leads (
    id, 
    first_name, 
    email, 
    website_url, 
    status, 
    analysis_sent
  )
  VALUES (
    gen_random_uuid(), 
    first_name, 
    email, 
    normalized_url, 
    'pending', 
    false
  )
  RETURNING id INTO new_id;

  -- Send webhook to n8n using pg_net
  PERFORM net.http_post(
    url := 'https://n8n.arsenio.at/webhook/analyse-leads',
    body := json_build_object(
      'type', 'lead.created',
      'data', json_build_object(
        'id', new_id,
        'first_name', first_name,
        'website_url', normalized_url,
        'email', email,
        'created_at', now(),
        'status', 'pending'
      ),
      'timestamp', now()
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
CREATE POLICY "Allow RPC lead creation"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 8. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS leads_email_unique ON leads (email);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_analysis_sent_idx ON leads (analysis_sent);
CREATE INDEX IF NOT EXISTS leads_analysis_sent_at_idx ON leads (analysis_sent_at DESC);

-- 9. GRANT NECESSARY PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON leads TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_new_lead(text, text, text) TO anon, authenticated;