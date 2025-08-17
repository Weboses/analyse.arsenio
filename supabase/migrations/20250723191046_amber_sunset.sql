/*
  # Create leads table for website analysis requests

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `first_name` (text, required)
      - `website_url` (text, required)
      - `email` (text, required, unique)
      - `phone` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text, default 'pending')
      - `analysis_sent` (boolean, default false)

  2. Security
    - Enable RLS on `leads` table
    - Add policy for public insert (for lead form)
    - Add policy for authenticated users to read all data (for admin)

  3. Indexes
    - Index on email for fast lookups
    - Index on created_at for sorting
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  website_url text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'contacted', 'converted')),
  analysis_sent boolean DEFAULT false
);

-- Create unique index on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique ON leads(email);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_analysis_sent_idx ON leads(analysis_sent);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy for public insert (lead form submissions)
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy for authenticated users to read all leads (admin access)
CREATE POLICY "Authenticated users can read all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to update leads (admin access)
CREATE POLICY "Authenticated users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();