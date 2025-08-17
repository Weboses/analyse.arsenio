/*
  # Fix RLS policies for leads table

  1. New Tables
    - `leads` table (if not exists)
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `website_url` (text)
      - `email` (text, unique)
      - `phone` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text, default 'pending')
      - `analysis_sent` (boolean, default false)

  2. Security
    - Enable RLS on `leads` table
    - Add policy for anonymous users to insert leads
    - Add policy for authenticated users to read/update leads

  3. Changes
    - Drop existing policies if they exist
    - Create new working policies
    - Add proper indexes
*/

-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
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

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can read all leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;

-- Create new policies that work
CREATE POLICY "Allow anonymous insert"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS leads_email_unique ON leads (email);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_analysis_sent_idx ON leads (analysis_sent);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();